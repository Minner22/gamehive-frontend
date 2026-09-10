import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame } from '@/test/fixtures'
import ExpansionFormPage from './ExpansionFormPage'
import GameFormPage from './GameFormPage'

/**
 * Tryb moderatorski formularzy (GH-54): ten sam formularz, ale zapis idzie przez
 * `/moderation/**`, a wysyłki do moderacji nie ma — pozycja już jest w bibliotece.
 * Uprawnienia pilnuje trasa (`ProtectedRoute`), więc tu testujemy samo zachowanie.
 */

function mockTaxonomy() {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () =>
      HttpResponse.json([{ id: 1, name: 'Ekonomiczna' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () =>
      HttpResponse.json([{ id: 1, name: 'Worker placement' }]),
    ),
  )
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TestProviders>
        <Routes>
          <Route path="/moderation/games/:id/edit" element={<GameFormPage mode="moderator" />} />
          <Route
            path="/moderation/expansions/:id/edit"
            element={<ExpansionFormPage mode="moderator" />}
          />
          <Route path="/games/:id" element={<div>SZCZEGÓŁY GRY</div>} />
          <Route path="/expansions/:id" element={<div>SZCZEGÓŁY DODATKU</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('edycja gry z biblioteki przez moderatora', () => {
  beforeEach(mockTaxonomy)

  it('zapisuje przez /moderation/games/{id}, a nie przez ścieżkę autora', async () => {
    let moderatorPut: Record<string, unknown> | null = null
    let ownerPutCalls = 0
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/10`, () =>
        HttpResponse.json(makeGame({ id: 10, title: 'Agricola' })),
      ),
      http.put(`${ANY_ORIGIN}/api/v1/moderation/games/10`, async ({ request }) => {
        moderatorPut = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeGame({ id: 10 }))
      }),
      http.put(`${ANY_ORIGIN}/api/v1/games/10`, () => {
        ownerPutCalls++
        return HttpResponse.json(makeGame({ id: 10 }))
      }),
    )
    renderAt('/moderation/games/10/edit')

    expect(await screen.findByText('Edycja pozycji z biblioteki')).toBeInTheDocument()
    // Pozycja już jest w bibliotece — wysyłka do moderacji nie ma tu sensu.
    expect(screen.queryByRole('button', { name: /Wyślij do moderacji/ })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Tytuł'))
    await userEvent.type(screen.getByLabelText('Tytuł'), 'Agricola (edycja poprawiona)')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    await waitFor(() => expect(moderatorPut).not.toBeNull())
    expect(moderatorPut).toMatchObject({ title: 'Agricola (edycja poprawiona)' })
    expect(ownerPutCalls).toBe(0)
    expect(await screen.findByText('SZCZEGÓŁY GRY')).toBeInTheDocument()
  })

  /** Backend odpowiada 409 GAME_NOT_APPROVED (sprawdzone na żywo) — mówimy o tym wcześniej. */
  it('zgłoszenie spoza biblioteki blokuje zapis', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/28`, () =>
        HttpResponse.json(makeGame({ id: 28, moderationStatus: 'PENDING' })),
      ),
    )
    renderAt('/moderation/games/28/edit')

    expect(await screen.findByText(/ta gra nie jest zatwierdzona/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zapisz zmiany/ })).toBeDisabled()
  })

  it('GAME_NOT_APPROVED z backendu wraca do strony gry', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/10`, () => HttpResponse.json(makeGame({ id: 10 }))),
      http.put(`${ANY_ORIGIN}/api/v1/moderation/games/10`, () =>
        HttpResponse.json({ errorCode: 'GAME_NOT_APPROVED', message: 'Game is not approved' }, { status: 409 }),
      ),
    )
    renderAt('/moderation/games/10/edit')

    await screen.findByText('Edycja pozycji z biblioteki')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    expect(await screen.findByText('SZCZEGÓŁY GRY')).toBeInTheDocument()
  })
})

describe('edycja dodatku z biblioteki przez moderatora', () => {
  beforeEach(mockTaxonomy)

  it('zapisuje przez /moderation/expansions/{id}', async () => {
    let moderatorPut: Record<string, unknown> | null = null
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/expansions/19`, () =>
        HttpResponse.json(makeExpansion({ id: 19, baseGameId: 10, name: 'Agricola: Rzeka' })),
      ),
      http.get(`${ANY_ORIGIN}/api/v1/games/10`, () => HttpResponse.json(makeGame({ id: 10 }))),
      http.put(`${ANY_ORIGIN}/api/v1/moderation/expansions/19`, async ({ request }) => {
        moderatorPut = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeExpansion({ id: 19 }))
      }),
    )
    renderAt('/moderation/expansions/19/edit')

    expect(await screen.findByText('Edycja dodatku w bibliotece')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wyślij do moderacji/ })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Nazwa dodatku'))
    await userEvent.type(screen.getByLabelText('Nazwa dodatku'), 'Agricola: Rzeka i młyn')
    await userEvent.click(screen.getByRole('button', { name: /Zapisz zmiany/ }))

    await waitFor(() => expect(moderatorPut).not.toBeNull())
    expect(moderatorPut).toMatchObject({ name: 'Agricola: Rzeka i młyn' })
    expect(await screen.findByText('SZCZEGÓŁY DODATKU')).toBeInTheDocument()
  })
})
