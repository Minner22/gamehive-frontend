import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { ROUTES } from '@/routes/paths'
import PasswordResetConfirmPage from './PasswordResetConfirmPage'

const CONFIRM = `${ANY_ORIGIN}/api/v1/auth/password-reset/confirm`

function mockConfirm(status: number, body?: object) {
  server.use(
    http.post(CONFIRM, () =>
      body ? HttpResponse.json(body, { status }) : new HttpResponse(null, { status }),
    ),
  )
}

function renderPage(search = '?token=link-z-maila') {
  render(
    <MemoryRouter initialEntries={[`${ROUTES.passwordResetConfirm}${search}`]}>
      <TestProviders>
        <PasswordResetConfirmPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

async function submitNewPassword() {
  renderPage()
  await userEvent.type(screen.getByLabelText('Nowe hasło'), 'password123')
  await userEvent.type(screen.getByLabelText('Powtórz nowe hasło'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: 'Ustaw nowe hasło' }))
}

/** Każdy powód odrzucenia linku ma inną radę dla użytkownika (#88). */
describe('PasswordResetConfirmPage — odrzucony link', () => {
  it('TOKEN_REVOKED → link zastąpiony nowszym, prośba o nowy jako główna akcja', async () => {
    mockConfirm(401, { errorCode: 'TOKEN_REVOKED', message: 'Password reset token has been suspended' })
    await submitNewPassword()

    expect(await screen.findByText(/zastąpiony nowszym albo hasło zostało już zmienione/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Poproś o nowy link/ })).toHaveAttribute(
      'href',
      ROUTES.passwordResetRequest,
    )
    expect(screen.getByRole('link', { name: 'Wróć do logowania' })).toBeInTheDocument()
    expect(screen.queryByText(/suspended/)).not.toBeInTheDocument()
  })

  it('JWT_BLACKLISTED → link już użyty, logowanie jako główna akcja', async () => {
    mockConfirm(401, { errorCode: 'JWT_BLACKLISTED', message: 'Token has already been used' })
    await submitNewPassword()

    expect(await screen.findByText(/Ten link został już użyty/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Przejdź do logowania/ })).toHaveAttribute('href', ROUTES.login)
    expect(screen.getByRole('link', { name: /Poproś o nowy link/ })).toBeInTheDocument()
  })

  it.each([
    ['401 JWT_EXPIRED', 401, { errorCode: 'JWT_EXPIRED' }],
    ['401 bez kodu', 401, undefined],
    ['400 bez błędów pól (zniekształcony token)', 400, { errorCode: 'JWT_PARSE_ERROR' }],
  ])('%s → ogólny komunikat „nieprawidłowy lub wygasł”', async (_, status, body) => {
    mockConfirm(status, body)
    await submitNewPassword()

    expect(await screen.findByText('Link do resetu hasła jest nieprawidłowy lub wygasł.')).toBeInTheDocument()
  })

  it('400 z błędem pola zostaje na formularzu, przy polu hasła', async () => {
    mockConfirm(400, {
      errorCode: 'VALIDATION_ERROR',
      errors: [{ field: 'newPassword', message: 'Password too weak' }],
    })
    await submitNewPassword()

    expect(await screen.findByLabelText('Nowe hasło')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText(/Link nieaktualny/)).not.toBeInTheDocument()
  })

  it('link bez tokenu → ogólny komunikat bez wysyłania czegokolwiek', () => {
    renderPage('')

    expect(screen.getByText('Link do resetu hasła jest nieprawidłowy lub wygasł.')).toBeInTheDocument()
  })

  it('poprawny link → hasło zmienione', async () => {
    mockConfirm(200)
    await submitNewPassword()

    expect(await screen.findByText('Hasło zmienione')).toBeInTheDocument()
  })
})
