import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { AuthProvider, useAuth } from './AuthContext'

function Probe() {
  const { status, user } = useAuth()
  return (
    <div>
      status:{status};user:{user?.username ?? '-'}
    </div>
  )
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

describe('AuthProvider — bootstrap sesji', () => {
  it('brak sesji (refresh 401) → unauthenticated', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    renderProvider()
    await waitFor(() => expect(screen.getByText(/status:unauthenticated/)).toBeInTheDocument())
  })

  it('ważna sesja (refresh 200 + /users/me) → authenticated z userem', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => HttpResponse.json({ accessToken: 'tok' })),
      http.get(`${ANY_ORIGIN}/api/v1/users/me`, () =>
        HttpResponse.json({
          id: '1',
          username: 'ada',
          email: 'ada@gamehive.io',
          enabled: true,
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
          profile: {},
        }),
      ),
    )
    renderProvider()
    await waitFor(() =>
      expect(screen.getByText(/status:authenticated;user:ada/)).toBeInTheDocument(),
    )
  })

  it('błąd serwera przy refresh (500) → error (nie unauthenticated)', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 500 })),
    )
    renderProvider()
    await waitFor(() => expect(screen.getByText(/status:error/)).toBeInTheDocument())
  })
})
