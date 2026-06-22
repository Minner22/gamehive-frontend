import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

type Status = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

const auth = vi.hoisted(() => ({
  status: 'loading' as Status,
  retry: vi.fn(),
  hasRole: vi.fn(() => false),
}))
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => auth }))

function renderGuarded(element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<div>STRONA LOGOWANIA</div>} />
        <Route path="/" element={<div>STRONA GŁÓWNA</div>} />
        <Route path="/secret" element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('status loading → loader, bez treści chronionej', () => {
    auth.status = 'loading'
    renderGuarded(
      <ProtectedRoute>
        <div>SEKRET</div>
      </ProtectedRoute>,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('SEKRET')).not.toBeInTheDocument()
  })

  it('status error → ekran „Spróbuj ponownie" (NIE wylogowuje)', () => {
    auth.status = 'error'
    renderGuarded(
      <ProtectedRoute>
        <div>SEKRET</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText(/Nie udało się połączyć/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/ })).toBeInTheDocument()
    expect(screen.queryByText('STRONA LOGOWANIA')).not.toBeInTheDocument()
  })

  it('status unauthenticated → przekierowanie na /login', () => {
    auth.status = 'unauthenticated'
    renderGuarded(
      <ProtectedRoute>
        <div>SEKRET</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText('STRONA LOGOWANIA')).toBeInTheDocument()
  })

  it('zalogowany bez wymaganej roli → strona główna', () => {
    auth.status = 'authenticated'
    auth.hasRole.mockReturnValue(false)
    renderGuarded(
      <ProtectedRoute role="ROLE_ADMIN">
        <div>SEKRET</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText('STRONA GŁÓWNA')).toBeInTheDocument()
  })

  it('zalogowany z wymaganą rolą → renderuje treść chronioną', () => {
    auth.status = 'authenticated'
    auth.hasRole.mockReturnValue(true)
    renderGuarded(
      <ProtectedRoute role="ROLE_ADMIN">
        <div>SEKRET</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText('SEKRET')).toBeInTheDocument()
  })
})
