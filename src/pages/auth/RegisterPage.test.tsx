import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { ERROR_MESSAGES } from '@/lib/errorMessages'
import RegisterPage from './RegisterPage'

function mockRegister(status: number, body: object) {
  server.use(http.post(`${ANY_ORIGIN}/api/v1/auth/register`, () => HttpResponse.json(body, { status })))
}

async function fillAndSubmit() {
  render(
    <MemoryRouter>
      <TestProviders>
        <RegisterPage />
      </TestProviders>
    </MemoryRouter>,
  )
  await userEvent.type(await screen.findByLabelText('Nazwa użytkownika'), 'jane_smith')
  await userEvent.type(screen.getByLabelText('E-mail'), 'jane@example.com')
  await userEvent.type(screen.getByLabelText('Hasło'), 'password123')
  await userEvent.type(screen.getByLabelText('Powtórz hasło'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /Załóż konto|Zarejestruj/ }))
}

/** Oba konflikty to 409 — wcześniej oba lądowały przy polu e-mail (#81). */
describe('RegisterPage — zajęte dane', () => {
  it('zajęty e-mail → błąd przy polu e-mail', async () => {
    mockRegister(409, { errorCode: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' })
    await fillAndSubmit()

    expect(await screen.findByText(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS)).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nazwa użytkownika')).not.toHaveAttribute('aria-invalid')
  })

  it('zajęta nazwa użytkownika → błąd przy polu nazwy, nie przy e-mailu', async () => {
    mockRegister(409, { errorCode: 'USERNAME_ALREADY_EXISTS', message: 'Username already exists' })
    await fillAndSubmit()

    expect(await screen.findByText(ERROR_MESSAGES.USERNAME_ALREADY_EXISTS)).toBeInTheDocument()
    expect(screen.getByLabelText('Nazwa użytkownika')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Username already exists')).not.toBeInTheDocument()
  })
})
