import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeGame } from '@/test/fixtures'
import type { GameDto } from '@/api/types'
import GameFormPage from './GameFormPage'

let created: Record<string, unknown> | null = null

function mockTaxonomy() {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () =>
      HttpResponse.json([
        { id: 1, name: 'Ekonomiczna' },
        { id: 2, name: 'Rodzinna' },
      ]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () =>
      HttpResponse.json([{ id: 1, name: 'Worker placement' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/publishers/suggest`, () =>
      HttpResponse.json([{ id: 7, name: 'Lookout Games', status: 'APPROVED' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/authors/suggest`, () => HttpResponse.json([])),
  )
}

function mockCreate(status = 201) {
  created = null
  server.use(
    http.post(`${ANY_ORIGIN}/api/v1/games`, async ({ request }) => {
      created = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeGame({ id: 42, moderationStatus: 'DRAFT' }), { status })
    }),
  )
}

function renderForm(entry = '/games/new') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TestProviders>
        <Routes>
          <Route path="/games/new" element={<GameFormPage />} />
          <Route path="/games/:id/edit" element={<GameFormPage />} />
          <Route path="/games/:id" element={<div>SZCZEGÓŁY GRY</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

/** Wypełnia komplet wymaganych pól poprawnymi wartościami. */
async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText('Tytuł'), 'Agricola')
  await userEvent.type(screen.getByLabelText('Opis'), 'Gra o gospodarstwie')
  await userEvent.type(screen.getByLabelText('Min. graczy'), '1')
  await userEvent.type(screen.getByLabelText('Maks. graczy'), '5')
  await userEvent.type(screen.getByLabelText('Czas gry (min)'), '120')
  await userEvent.type(screen.getByLabelText('Rok wydania'), '2007')
  await userEvent.type(screen.getByLabelText('Wiek gracza'), '12')
  await userEvent.type(screen.getByLabelText('Wydawcy'), 'look')
  await userEvent.click(await screen.findByRole('option', { name: /Lookout Games/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Ekonomiczna' }))
}

describe('GameFormPage — nowe zgłoszenie', () => {
  beforeEach(() => {
    mockTaxonomy()
    mockCreate()
  })

  it('zapisuje szkic z submit=false, a wysyłkę z submit=true', async () => {
    renderForm()
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    await waitFor(() => expect(created).not.toBeNull())
    expect(created).toMatchObject({
      title: 'Agricola',
      minPlayers: 1,
      maxPlayers: 5,
      submit: false,
      publisherIds: [7],
      categoryIds: [1],
    })
  })

  it('wysłanie do moderacji ustawia submit=true', async () => {
    renderForm()
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: /Wyślij do moderacji/ }))

    await waitFor(() => expect(created).not.toBeNull())
    expect(created).toMatchObject({ submit: true })
  })

  /** Reguła backendu `min <= max` sprawdzana lokalnie — bez okrążania serwera. */
  it('maks. graczy mniejsze od min. blokuje wysyłkę', async () => {
    renderForm()
    await fillRequiredFields()
    await userEvent.clear(screen.getByLabelText('Maks. graczy'))
    await userEvent.type(screen.getByLabelText('Maks. graczy'), '1')
    await userEvent.clear(screen.getByLabelText('Min. graczy'))
    await userEvent.type(screen.getByLabelText('Min. graczy'), '4')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    expect(
      await screen.findByText('Nie może być mniejsza od minimalnej liczby graczy'),
    ).toBeInTheDocument()
    expect(created).toBeNull()
  })

  it('brak wydawcy i kategorii pokazuje błędy przy polach', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Tytuł'), 'Bez wydawcy')
    await userEvent.type(screen.getByLabelText('Opis'), 'Opis')
    await userEvent.type(screen.getByLabelText('Min. graczy'), '2')
    await userEvent.type(screen.getByLabelText('Maks. graczy'), '4')
    await userEvent.type(screen.getByLabelText('Czas gry (min)'), '30')
    await userEvent.type(screen.getByLabelText('Rok wydania'), '2020')
    await userEvent.type(screen.getByLabelText('Wiek gracza'), '8')

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    expect(await screen.findByText('Wskaż przynajmniej jednego wydawcę')).toBeInTheDocument()
    expect(screen.getByText('Wybierz przynajmniej jedną kategorię')).toBeInTheDocument()
    expect(created).toBeNull()
  })

  /** Nowy wydawca jedzie osobnym polem — backend tworzy go w locie jako PENDING. */
  it('nowa nazwa wydawcy trafia do newPublisherNames, nie do publisherIds', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Tytuł'), 'Nowa gra')
    await userEvent.type(screen.getByLabelText('Opis'), 'Opis')
    await userEvent.type(screen.getByLabelText('Min. graczy'), '2')
    await userEvent.type(screen.getByLabelText('Maks. graczy'), '4')
    await userEvent.type(screen.getByLabelText('Czas gry (min)'), '30')
    await userEvent.type(screen.getByLabelText('Rok wydania'), '2020')
    await userEvent.type(screen.getByLabelText('Wiek gracza'), '8')
    await userEvent.type(screen.getByLabelText('Wydawcy'), 'Oficyna Ulowa')
    await userEvent.click(await screen.findByRole('option', { name: /Utwórz/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Ekonomiczna' }))
    await userEvent.type(screen.getByLabelText('Autorzy'), 'Uwe Rosenberg')
    await userEvent.click(await screen.findByRole('option', { name: /Utwórz/ }))

    await userEvent.click(screen.getByRole('button', { name: /Zapisz szkic/ }))

    await waitFor(() => expect(created).not.toBeNull())
    expect(created).toMatchObject({
      publisherIds: [],
      newPublisherNames: ['Oficyna Ulowa'],
      newAuthors: [{ firstName: 'Uwe', lastName: 'Rosenberg' }],
    })
  })
})

describe('GameFormPage — edycja', () => {
  function mockGame(game: GameDto) {
    server.use(http.get(`${ANY_ORIGIN}/api/v1/games/5`, () => HttpResponse.json(game)))
  }

  beforeEach(mockTaxonomy)

  it('wypełnia formularz danymi zgłoszenia', async () => {
    mockGame(makeGame({ id: 5, title: 'Mój szkic', moderationStatus: 'DRAFT' }))
    renderForm('/games/5/edit')

    expect(await screen.findByLabelText('Tytuł')).toHaveValue('Mój szkic')
    expect(screen.getByRole('button', { name: 'Usuń: Lookout Games' })).toBeInTheDocument()
  })

  /** PENDING jest nieedytowalne — backend zwróciłby 409, więc mówimy o tym wcześniej. */
  it('zgłoszenie w moderacji blokuje zapis', async () => {
    mockGame(makeGame({ id: 5, moderationStatus: 'PENDING' }))
    renderForm('/games/5/edit')

    expect(await screen.findByText(/edycja jest zablokowana/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zapisz zmiany/ })).toBeDisabled()
  })

  it('zapis zmian wysyła PUT i wraca do szczegółów', async () => {
    let updated: Record<string, unknown> | null = null
    mockGame(makeGame({ id: 5, moderationStatus: 'DRAFT' }))
    server.use(
      http.put(`${ANY_ORIGIN}/api/v1/games/5`, async ({ request }) => {
        updated = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeGame({ id: 5 }))
      }),
    )
    renderForm('/games/5/edit')

    await userEvent.clear(await screen.findByLabelText('Tytuł'))
    await userEvent.type(screen.getByLabelText('Tytuł'), 'Poprawiony tytuł')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    await waitFor(() => expect(updated).not.toBeNull())
    expect(updated).toMatchObject({ title: 'Poprawiony tytuł' })
    expect(await screen.findByText('SZCZEGÓŁY GRY')).toBeInTheDocument()
  })

  /** PUT nie zmienia statusu — wysyłka do moderacji to osobne wywołanie. */
  it('„wyślij do moderacji" w edycji robi PUT i POST /submit', async () => {
    let submitCalls = 0
    mockGame(makeGame({ id: 5, moderationStatus: 'REJECTED' }))
    server.use(
      http.put(`${ANY_ORIGIN}/api/v1/games/5`, () => HttpResponse.json(makeGame({ id: 5 }))),
      http.post(`${ANY_ORIGIN}/api/v1/games/5/submit`, () => {
        submitCalls++
        return HttpResponse.json(makeGame({ id: 5, moderationStatus: 'PENDING' }))
      }),
    )
    renderForm('/games/5/edit')

    await screen.findByLabelText('Tytuł')
    await userEvent.click(screen.getByRole('button', { name: /Wyślij do moderacji/ }))

    await waitFor(() => expect(submitCalls).toBe(1))
  })

  /** Kod domenowy backendu ma trafić przy pole, a nie do ogólnego toastu. */
  it('INVALID_PLAYER_COUNT z backendu ląduje przy polu „maks. graczy"', async () => {
    mockGame(makeGame({ id: 5, moderationStatus: 'DRAFT' }))
    server.use(
      http.put(`${ANY_ORIGIN}/api/v1/games/5`, () =>
        HttpResponse.json(
          { errorCode: 'INVALID_PLAYER_COUNT', message: 'Maksimum nie może być mniejsze od minimum' },
          { status: 400 },
        ),
      ),
    )
    renderForm('/games/5/edit')

    await screen.findByLabelText('Tytuł')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    expect(
      await screen.findByText('Maksimum nie może być mniejsze od minimum'),
    ).toBeInTheDocument()
  })

  it('nieistniejące zgłoszenie daje ekran „nie znaleziono"', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/5`, () =>
        HttpResponse.json({ errorCode: 'GAME_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderForm('/games/5/edit')

    expect(await screen.findByText('Nie znaleziono zgłoszenia')).toBeInTheDocument()
  })
})
