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
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/apiError'
import { ASSIGNABLE_ROLES, displayRoles, roleLabel } from '@/lib/roles'

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
  const [roles, setRoles] = useState<Role[]>(user.roles)

  const isSelf = current?.id === user.id

  // Wszystkie przypisywalne role + ewentualne nietypowe, które user już ma.
  const allRoles = Array.from(new Set<Role>([...ASSIGNABLE_ROLES, ...user.roles]))
  const rolesChanged =
    roles.length !== user.roles.length || roles.some((r) => !user.roles.includes(r))

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

  const toggleRole = (role: Role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))

  const saveRoles = () =>
    run('roles', () => updateUserRoles(user.id, { roles }), () => onUpdated({ ...user, roles }), 'Role zaktualizowane')

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
            {displayRoles(user.roles).map((r) => (
              <Badge key={r} tone="gold">
                {r}
              </Badge>
            ))}
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

        <Button
          variant="secondary"
          fullWidth
          iconLeft={user.enabled ? 'block' : 'check_circle'}
          loading={busy === 'active'}
          disabled={!!busy || (isSelf && user.enabled)}
          onClick={toggleActive}
        >
          {user.enabled ? 'Dezaktywuj konto' : 'Aktywuj konto'}
        </Button>

        <div className="space-y-2">
          <p className="px-1 text-sm font-semibold text-on-surface-variant">Role</p>
          <div className="flex flex-wrap gap-2">
            {allRoles.map((role) => {
              const on = roles.includes(role)
              // Nie pozwól odebrać sobie roli administratora (samoblokada).
              const locked = isSelf && role === 'ROLE_ADMIN'
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={on}
                  disabled={!!busy || locked}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                    on
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
                  )}
                >
                  {roleLabel(role)}
                </button>
              )
            })}
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeft="save"
            loading={busy === 'roles'}
            disabled={!!busy || !rolesChanged || roles.length === 0}
            onClick={saveRoles}
          >
            Zapisz role
          </Button>
        </div>

        <Button
          variant="secondary"
          fullWidth
          iconLeft="logout"
          loading={busy === 'logout'}
          disabled={!!busy || isSelf}
          onClick={forceLogout}
        >
          Wymuś wylogowanie
        </Button>

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
