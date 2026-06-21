import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import {
  activateUser,
  deactivateUser,
  deleteUser,
  forceLogoutUser,
  updateUserRoles,
} from '@/api/admin'
import type { Role, UserResponseDto } from '@/api/types'
import { Badge, Button, Dialog, HexAvatar, useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

interface Props {
  user: UserResponseDto
  onClose: () => void
  onUpdated: (user: UserResponseDto) => void
  onDeleted: (id: string) => void
}

export function UserActionsDialog({ user, onClose, onUpdated, onDeleted }: Props) {
  const toast = useToast()
  const { user: current } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isSelf = current?.id === user.id
  const isAdmin = user.roles.includes('ROLE_ADMIN')

  // Wspólny bieg akcji: blokada przycisków, toast sukcesu/błędu.
  const run = async (key: string, fn: () => Promise<void>, after: () => void, ok: string) => {
    setBusy(key)
    try {
      await fn()
      after()
      toast.success(ok)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const toggleActive = () =>
    user.enabled
      ? run('active', () => deactivateUser(user.id), () => onUpdated({ ...user, enabled: false }), 'Konto dezaktywowane')
      : run('active', () => activateUser(user.id), () => onUpdated({ ...user, enabled: true }), 'Konto aktywowane')

  const toggleAdmin = () => {
    const roles: Role[] = isAdmin
      ? user.roles.filter((r) => r !== 'ROLE_ADMIN')
      : [...user.roles, 'ROLE_ADMIN']
    if (!roles.includes('ROLE_USER')) roles.push('ROLE_USER')
    run(
      'roles',
      () => updateUserRoles(user.id, { roles }),
      () => onUpdated({ ...user, roles }),
      isAdmin ? 'Odebrano rolę administratora' : 'Nadano rolę administratora',
    )
  }

  const forceLogout = () =>
    run('logout', () => forceLogoutUser(user.id), () => {}, 'Wymuszono wylogowanie')

  const remove = () =>
    run('delete', () => deleteUser(user.id), () => onDeleted(user.id), 'Konto usunięte')

  return (
    <Dialog open onClose={onClose} title="Zarządzaj użytkownikiem">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <HexAvatar name={user.username} src={user.profile?.profilePictureUrl} size={48} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-on-surface">{user.username}</p>
            <p className="truncate text-sm text-on-surface-variant">{user.email}</p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
            {isAdmin && <Badge tone="gold">ADMIN</Badge>}
            <Badge tone={user.enabled ? 'success' : 'danger'}>
              {user.enabled ? 'Aktywny' : 'Nieaktywny'}
            </Badge>
          </div>
        </div>

        {isSelf && (
          <p className="rounded-xl bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant">
            To Twoje konto — akcje, które mogłyby Cię zablokować, są wyłączone.
          </p>
        )}

        <div className="grid gap-2">
          <Button
            variant="secondary"
            iconLeft={user.enabled ? 'block' : 'check_circle'}
            loading={busy === 'active'}
            disabled={!!busy || (isSelf && user.enabled)}
            onClick={toggleActive}
          >
            {user.enabled ? 'Dezaktywuj konto' : 'Aktywuj konto'}
          </Button>
          <Button
            variant="secondary"
            iconLeft="shield_person"
            loading={busy === 'roles'}
            disabled={!!busy || (isSelf && isAdmin)}
            onClick={toggleAdmin}
          >
            {isAdmin ? 'Odbierz rolę administratora' : 'Nadaj rolę administratora'}
          </Button>
          <Button
            variant="secondary"
            iconLeft="logout"
            loading={busy === 'logout'}
            disabled={!!busy || isSelf}
            onClick={forceLogout}
          >
            Wymuś wylogowanie
          </Button>
        </div>

        <div className="border-t border-outline-variant/20 pt-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Na pewno usunąć konto <b className="text-on-surface">{user.username}</b>? Tej
                operacji nie można cofnąć.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  Anuluj
                </Button>
                <Button
                  iconLeft="delete"
                  loading={busy === 'delete'}
                  disabled={!!busy}
                  onClick={remove}
                  className="bg-error text-on-error hover:bg-error/90"
                >
                  Usuń trwale
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              iconLeft="delete"
              disabled={!!busy || isSelf}
              onClick={() => setConfirmDelete(true)}
              className="text-error hover:bg-error/10"
            >
              Usuń konto
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
