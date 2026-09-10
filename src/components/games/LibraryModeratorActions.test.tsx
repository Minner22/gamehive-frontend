import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { LibraryModeratorActions } from './LibraryModeratorActions'

let meCalls = 0

/** Sesja z podanymi rolami — AuthProvider odtwarza ją przez refresh + /users/me. */
function mockSession(roles: string[]) {
  meCalls = 0
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => HttpResponse.json({ accessToken: 't' })),
    http.get(`${ANY_ORIGIN}/api/v1/users/me`, () => {
      meCalls++
      return HttpResponse.json({
        id: 'u1',
        username: 'mod',
        email: 'mod@gamehive.io',
        enabled: true,
        roles,
        profile: {},
      })
    }),
    // Kontekst kolekcji dla zalogowanego czyta kolekcję — tu bez znaczenia.
    http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () =>
      HttpResponse.json({ content: [], empty: true, first: true, last: true, number: 0, numberOfElements: 0, size: 200, totalElements: 0, totalPages: 0 }),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () =>
      HttpResponse.json({ content: [], empty: true, first: true, last: true, number: 0, numberOfElements: 0, size: 200, totalElements: 0, totalPages: 0 }),
    ),
  )
}

function renderActions(remove: () => Promise<void>) {
  return render(
    <MemoryRouter initialEntries={['/games/10']}>
      <TestProviders>
        <Routes>
          <Route
            path="/games/10"
            element={
              <LibraryModeratorActions
                kind="game"
                name="Agricola"
                editHref="/moderation/games/10/edit"
                remove={remove}
                afterDeleteHref="/games"
                expansionsHref="/expansions?baseGameId=10"
              />
            }
          />
          <Route path="/games" element={<div>BIBLIOTEKA</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('LibraryModeratorActions', () => {
  /** Endpointy moderatora odpowiadają zwykłemu użytkownikowi 403 — nie ma czego pokazywać. */
  it('jest niewidoczne dla zwykłego użytkownika', async () => {
    mockSession(['ROLE_USER'])
    renderActions(async () => undefined)

    await waitFor(() => expect(meCalls).toBe(1))
    expect(screen.queryByText('Narzędzia moderatora')).not.toBeInTheDocument()
  })

  it('moderator widzi edycję prowadzącą do ścieżki moderatorskiej', async () => {
    mockSession(['ROLE_USER', 'ROLE_MODERATOR'])
    renderActions(async () => undefined)

    expect(await screen.findByRole('link', { name: /Edytuj w bibliotece/ })).toHaveAttribute(
      'href',
      '/moderation/games/10/edit',
    )
  })

  it('usunięcie wymaga potwierdzenia i wraca do biblioteki', async () => {
    mockSession(['ROLE_ADMIN'])
    let removed = 0
    renderActions(async () => {
      removed++
    })

    await userEvent.click(await screen.findByRole('button', { name: /Usuń z biblioteki/ }))
    // Pierwszy krok niczego nie kasuje — tylko otwiera ostrzeżenie o skutkach.
    expect(removed).toBe(0)
    expect(screen.getByText(/Tej operacji nie da się cofnąć/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Usuń trwale/ }))

    expect(await screen.findByText('BIBLIOTEKA')).toBeInTheDocument()
    expect(removed).toBe(1)
  })

  it('anulowanie zamyka okno bez usuwania', async () => {
    mockSession(['ROLE_MODERATOR'])
    let removed = 0
    renderActions(async () => {
      removed++
    })

    await userEvent.click(await screen.findByRole('button', { name: /Usuń z biblioteki/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }))

    expect(screen.queryByText(/Tej operacji nie da się cofnąć/)).not.toBeInTheDocument()
    expect(removed).toBe(0)
  })

  /**
   * Backend blokuje usunięcie gry, do której są dodatki (sprawdzone na żywo:
   * DELETE /moderation/games/10 → 409 GAME_HAS_EXPANSIONS). Komunikat ma prowadzić
   * do dodatków, a nie zostawiać moderatora z surowym kodem.
   */
  it('GAME_HAS_EXPANSIONS prowadzi do dodatków i blokuje ponowną próbę', async () => {
    mockSession(['ROLE_MODERATOR'])
    renderActions(async () => {
      throw Object.assign(new Error('409'), {
        isAxiosError: true,
        response: {
          status: 409,
          data: { errorCode: 'GAME_HAS_EXPANSIONS', message: 'Game cannot be deleted' },
        },
      })
    })

    await userEvent.click(await screen.findByRole('button', { name: /Usuń z biblioteki/ }))
    await userEvent.click(screen.getByRole('button', { name: /Usuń trwale/ }))

    expect(await screen.findByText(/dopóki ma dodatki/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zobacz dodatki tej gry/ })).toHaveAttribute(
      'href',
      '/expansions?baseGameId=10',
    )
    expect(screen.getByRole('button', { name: /Usuń trwale/ })).toBeDisabled()
  })
})
