import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button, Icon, Spinner } from '@/components/ui'
import { ROUTES } from '@/routes/paths'
import type { Role } from '@/api/types'

interface ProtectedRouteProps {
  children: ReactNode
  /** Wymagana rola (np. 'ROLE_ADMIN'). Pominięta = wystarczy zalogowanie. */
  role?: Role
}

/**
 * Bramka tras wymagających zalogowania (i opcjonalnie roli).
 *
 * - podczas odtwarzania sesji pokazuje loader,
 * - błąd połączenia przy starcie → ekran „spróbuj ponownie" (nie wylogowuje),
 * - niezalogowany → /login z zapamiętaniem `from`,
 * - zalogowany bez wymaganej roli → strona główna.
 */
export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { status, retry, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="text-4xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Icon name="cloud_off" className="text-4xl text-on-surface-variant" />
        <p className="text-on-surface-variant">Nie udało się połączyć z serwerem.</p>
        <Button iconLeft="refresh" onClick={() => void retry()}>
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  if (role && !hasRole(role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <>{children}</>
}
