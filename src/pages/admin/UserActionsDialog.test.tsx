import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UserResponseDto } from '@/api/types'
import { ToastProvider } from '@/components/ui'
import { UserActionsDialog } from './UserActionsDialog'

const auth = vi.hoisted(() => ({ user: { id: 'me' } as { id: string } | null }))
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => auth }))

function renderDialog(user: UserResponseDto) {
  return render(
    <ToastProvider>
      <UserActionsDialog
        user={user}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    </ToastProvider>,
  )
}

const adminUser: UserResponseDto = {
  id: 'me',
  username: 'admin',
  email: 'admin@gamehive.io',
  enabled: true,
  roles: ['ROLE_USER', 'ROLE_ADMIN'],
}

describe('UserActionsDialog — samoblokada na własnym koncie', () => {
  it('na własnym koncie wyłącza akcje mogące zablokować i odebranie sobie admina', () => {
    auth.user = { id: 'me' }
    renderDialog(adminUser)

    expect(screen.getByText(/To Twoje konto/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dezaktywuj konto/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Wymuś wylogowanie/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Usuń konto/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Administrator' })).toBeDisabled()
  })

  it('na cudzym koncie akcje są dostępne', () => {
    auth.user = { id: 'admin-1' }
    renderDialog({
      id: 'other',
      username: 'bob',
      email: 'bob@example.com',
      enabled: true,
      roles: ['ROLE_USER'],
    })

    expect(screen.queryByText(/To Twoje konto/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dezaktywuj konto/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Wymuś wylogowanie/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Usuń konto/ })).toBeEnabled()
  })
})
