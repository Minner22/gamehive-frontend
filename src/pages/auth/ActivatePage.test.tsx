import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { ROUTES } from '@/routes/paths'
import ActivatePage from './ActivatePage'

function mockActivate(status: number, body: object) {
  server.use(http.get(`${ANY_ORIGIN}/api/v1/auth/activate`, () => HttpResponse.json(body, { status })))
}

function renderPage(search = '?token=link-z-maila') {
  render(
    <MemoryRouter initialEntries={[`${ROUTES.activate}${search}`]}>
      <TestProviders>
        <ActivatePage />
      </TestProviders>
    </MemoryRouter>,
  )
}

const resendButton = () => screen.queryByRole('button', { name: /Wyślij link ponownie/ })

/** Każdy powód odrzucenia linku ma inną radę dla użytkownika (#88). */
describe('ActivatePage', () => {
  it('poprawny link → konto aktywowane', async () => {
    mockActivate(200, { message: 'Account has been successfully activated.' })
    renderPage()

    expect(await screen.findByText('Konto aktywowane')).toBeInTheDocument()
  })

  it('TOKEN_REVOKED → informacja o nowszym linku i formularz ponownego wysłania', async () => {
    mockActivate(401, { errorCode: 'TOKEN_REVOKED', message: 'Activation token has been suspended' })
    renderPage()

    expect(await screen.findByText(/Wysłaliśmy nowszy link aktywacyjny/)).toBeInTheDocument()
    expect(resendButton()).toBeInTheDocument()
    expect(screen.queryByText(/suspended/)).not.toBeInTheDocument()
  })

  it('JWT_BLACKLISTED → konto już aktywne, logowanie zamiast ponownego wysłania', async () => {
    mockActivate(401, { errorCode: 'JWT_BLACKLISTED', message: 'Activation token has already been used' })
    renderPage()

    expect(await screen.findByText(/Ten link został już użyty — konto jest aktywne/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Przejdź do logowania/ })).toHaveAttribute('href', ROUTES.login)
    expect(resendButton()).not.toBeInTheDocument()
  })

  /** Link ważny, ale konto aktywowano inaczej — backend nie blacklistuje wtedy tokenu (dev, 2026-11-22). */
  it('409 USER_ALREADY_ACTIVATED → konto już aktywne, logowanie zamiast ponownego wysłania', async () => {
    mockActivate(409, { errorCode: 'USER_ALREADY_ACTIVATED', message: 'User is already activated' })
    renderPage()

    expect(await screen.findByText('To konto jest już aktywne — możesz się zalogować.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Przejdź do logowania/ })).toHaveAttribute('href', ROUTES.login)
    expect(resendButton()).not.toBeInTheDocument()
  })

  it.each([
    ['401 JWT_EXPIRED', 401, { errorCode: 'JWT_EXPIRED' }],
    ['400 zniekształcony token', 400, { errorCode: 'JWT_PARSE_ERROR' }],
  ])('%s → ogólny komunikat i formularz ponownego wysłania', async (_, status, body) => {
    mockActivate(status, body)
    renderPage()

    expect(await screen.findByText(/nieprawidłowy lub wygasł/)).toBeInTheDocument()
    expect(resendButton()).toBeInTheDocument()
  })

  it('bez tokenu → sam formularz ponownego wysłania, bez żądania aktywacji', () => {
    renderPage('')

    expect(screen.getByText('Wpisz adres e-mail, aby otrzymać nowy link aktywacyjny.')).toBeInTheDocument()
    expect(resendButton()).toBeInTheDocument()
  })
})
