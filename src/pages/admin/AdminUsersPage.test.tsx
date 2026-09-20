import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makePage } from '@/test/fixtures'
import AdminUsersPage from './AdminUsersPage'

const USERS = `${ANY_ORIGIN}/api/v1/admin/users`

/** Lista jest tu tłem — cały test dotyczy wyszukiwarki pojedynczego użytkownika. */
function mockEmptyList() {
  server.use(http.get(`${USERS}/`, () => HttpResponse.json(makePage([]))))
}

function lookupFails(status: number, body: object) {
  server.use(
    http.get(`${USERS}/by-username/:username`, () => HttpResponse.json(body, { status })),
  )
}

async function search(value: string) {
  render(
    <TestProviders>
      <AdminUsersPage />
    </TestProviders>,
  )
  await userEvent.type(screen.getByLabelText('Szukana wartość'), value)
  await userEvent.click(screen.getByRole('button', { name: 'Szukaj' }))
}

describe('AdminUsersPage — wyszukiwanie użytkownika', () => {
  beforeEach(mockEmptyList)

  /** Kod domenowy = takiego konta nie ma. To zwykły wynik, nie awaria. */
  it('404 USER_NOT_FOUND pokazuje pusty wynik wyszukiwania', async () => {
    lookupFails(404, { errorCode: 'USER_NOT_FOUND', message: 'User not found' })

    await search('jan.kowalski')

    expect(
      await screen.findByText('Nie znaleziono użytkownika dla podanej wartości.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  /**
   * `RESOURCE_NOT_FOUND` (gamehive-backend#140) znaczy „nie ma takiej ścieżki",
   * czyli błąd po naszej stronie — nie wolno go pokazać jako braku konta,
   * bo literówka w `src/api/admin.ts` wyglądałaby jak nieistniejący użytkownik.
   */
  it('404 RESOURCE_NOT_FOUND zgłasza błąd zamiast braku konta', async () => {
    lookupFails(404, { errorCode: 'RESOURCE_NOT_FOUND', message: 'Resource not found' })

    await search('jan.kowalski')

    expect(await screen.findByRole('alert')).toHaveTextContent('Resource not found')
    expect(
      screen.queryByText('Nie znaleziono użytkownika dla podanej wartości.'),
    ).not.toBeInTheDocument()
  })
})
