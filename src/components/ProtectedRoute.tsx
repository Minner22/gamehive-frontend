import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Spinner } from '@/components/ui'
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
 * - podczas wstępnego odtwarzania sesji pokazuje loader (bez przekierowania),
 * - niezalogowany → /login z zapamiętaniem `from`,
 * - zalogowany bez wymaganej roli → strona główna.
 */
export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { status, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="text-4xl" />
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
