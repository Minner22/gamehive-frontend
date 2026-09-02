import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame, makePage, makeSearchResult } from '@/test/fixtures'
import type { GameExpansionDto } from '@/api/types'
import ExpansionFormPage from './ExpansionFormPage'

let created: Record<string, unknown> | null = null

const BASE_GAME = makeGame({ id: 7, title: 'Carcassonne', minPlayers: 2, maxPlayers: 5 })

function mockCommon() {
  created = null
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () =>
      HttpResponse.json([{ id: 1, name: 'Ekonomiczna' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () =>
      HttpResponse.json([{ id: 1, name: 'Worker placement' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/games/search`, () =>
      HttpResponse.json(makePage([makeSearchResult({ game: BASE_GAME })])),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/games/7`, () => HttpResponse.json(BASE_GAME)),
    http.post(`${ANY_ORIGIN}/api/v1/expansions`, async ({ request }) => {
      created = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeExpansion({ id: 9 }), { status: 201 })
    }),
  )
}

function mockExpansion(expansion: GameExpansionDto) {
  server.use(http.get(`${ANY_ORIGIN}/api/v1/expansions/9`, () => HttpResponse.json(expansion)))
}

function renderForm(entry = '/expansions/new') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TestProviders>
        <Routes>
          <Route path="/expansions/new" element={<ExpansionFormPage />} />
          <Route path="/expansions/:id/edit" element={<ExpansionFormPage />} />
          <Route path="/expansions/:id" element={<div>SZCZEGÓŁY DODATKU</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

async function pickBaseGame() {
  await userEvent.type(screen.getByLabelText('Gra bazowa'), 'carc')
  await userEvent.click(await screen.findByRole('option', { name: /Carcassonne/ }))
}

describe('ExpansionFormPage — nowe zgłoszenie', () => {
  beforeEach(mockCommon)

  /** Sedno modelu: puste pole to nie zero, tylko „dziedziczę z gry bazowej". */
  it('puste nadpisania wysyła jako brak wartości, wypełnione jako liczby', async () => {
    renderForm()
    await pickBaseGame()
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Rzeka')
    await userEvent.type(screen.getByLabelText('Opis'), 'Dodatek z rzeką')
    await userEvent.type(screen.getByLabelText('Maks. graczy'), '6')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    await waitFor(() => expect(created).not.toBeNull())
    expect(created).toMatchObject({ baseGameId: 7, name: 'Rzeka', maxPlayers: 6, submit: false })
    expect(created).not.toHaveProperty('minPlayers')
    expect(created).not.toHaveProperty('playingTimeMinutes')
  })

  it('podpowiada wartości gry bazowej pod polami nadpisań', async () => {
    renderForm()
    await pickBaseGame()

    expect(await screen.findByText('Puste = jak w grze bazowej: 2')).toBeInTheDocument()
    expect(screen.getByText('Puste = jak w grze bazowej: 5')).toBeInTheDocument()
  })

  it('bez gry bazowej nie wysyła zgłoszenia', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Sierota')
    await userEvent.type(screen.getByLabelText('Opis'), 'Bez gry bazowej')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    expect(await screen.findByText('Wskaż grę bazową')).toBeInTheDocument()
    expect(created).toBeNull()
  })

  /**
   * `min <= max` liczone na wartościach EFEKTYWNYCH: własne minimum 6 kontra
   * odziedziczone maksimum 5 to błąd, choć samo pole minimum jest poprawne.
   */
  it('nadpisane minimum ponad odziedziczone maksimum jest odrzucane', async () => {
    renderForm()
    await pickBaseGame()
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Za dużo graczy')
    await userEvent.type(screen.getByLabelText('Opis'), 'Opis')
    await userEvent.type(screen.getByLabelText('Min. graczy'), '6')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    expect(
      await screen.findByText(/maksimum wychodzi mniejsze od minimum/),
    ).toBeInTheDocument()
    expect(created).toBeNull()
  })

  it('wysłanie do moderacji ustawia submit=true', async () => {
    renderForm()
    await pickBaseGame()
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Rzeka')
    await userEvent.type(screen.getByLabelText('Opis'), 'Opis')

    await userEvent.click(screen.getByRole('button', { name: /Wyślij do moderacji/ }))

    await waitFor(() => expect(created).not.toBeNull())
    expect(created).toMatchObject({ submit: true })
  })

  /** Wejście z „Zgłoś dodatek" na stronie gry. */
  it('gra bazowa z adresu wypełnia pole', async () => {
    renderForm('/expansions/new?baseGameId=7')

    expect(await screen.findByRole('button', { name: 'Usuń: Carcassonne' })).toBeInTheDocument()
  })

  it('409 BASE_GAME_NOT_APPROVED ląduje przy polu gry bazowej', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/expansions`, () =>
        HttpResponse.json(
          { errorCode: 'BASE_GAME_NOT_APPROVED', message: 'Gra bazowa nie jest zatwierdzona' },
          { status: 409 },
        ),
      ),
    )
    renderForm()
    await pickBaseGame()
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Rzeka')
    await userEvent.type(screen.getByLabelText('Opis'), 'Opis')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    expect(await screen.findByText('Gra bazowa nie jest zatwierdzona')).toBeInTheDocument()
  })
})

describe('ExpansionFormPage — edycja', () => {
  beforeEach(mockCommon)

  /** `baseGame` jest po stronie backendu updatable=false — PUT i tak by to zignorował. */
  it('gra bazowa jest zablokowana i wyjaśnia dlaczego', async () => {
    mockExpansion(makeExpansion({ id: 9, moderationStatus: 'DRAFT', baseGameId: 7 }))
    renderForm('/expansions/9/edit')

    expect(await screen.findByLabelText('Gra bazowa')).toBeDisabled()
    expect(screen.getByText(/Gry bazowej nie da się zmienić/)).toBeInTheDocument()
  })

  it('zapis zmian wysyła PUT i wraca do szczegółów', async () => {
    let updated: Record<string, unknown> | null = null
    mockExpansion(makeExpansion({ id: 9, moderationStatus: 'DRAFT', baseGameId: 7 }))
    server.use(
      http.put(`${ANY_ORIGIN}/api/v1/expansions/9`, async ({ request }) => {
        updated = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeExpansion({ id: 9 }))
      }),
    )
    renderForm('/expansions/9/edit')

    await userEvent.clear(await screen.findByLabelText('Nazwa dodatku'))
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Nowa nazwa')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    await waitFor(() => expect(updated).not.toBeNull())
    expect(updated).toMatchObject({ name: 'Nowa nazwa' })
    expect(await screen.findByText('SZCZEGÓŁY DODATKU')).toBeInTheDocument()
  })

  it('zgłoszenie w moderacji blokuje zapis', async () => {
    mockExpansion(makeExpansion({ id: 9, moderationStatus: 'PENDING', baseGameId: 7 }))
    renderForm('/expansions/9/edit')

    expect(await screen.findByText(/edycja jest zablokowana/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zapisz zmiany/ })).toBeDisabled()
  })
})
