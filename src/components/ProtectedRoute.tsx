import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { RouteLoader } from '@/components/ui'
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
 * - niezalogowany LUB nieudane odtworzenie sesji → /login z zapamiętaniem `from`,
 * - zalogowany bez wymaganej roli → strona główna.
 */
export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { status, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <RouteLoader />
  }

  // WORKAROUND (backend #98): przy braku ciasteczka refresh /auth/refresh zwraca
  // 500 zamiast 401, więc niezalogowany ląduje w statusie 'error', nie
  // 'unauthenticated'. Dlatego kierujemy na /login każdy stan != 'authenticated'.
  // Po naprawie #98 przywrócić rozróżnienie: 'unauthenticated' → /login,
  // 'error' → ekran „Spróbuj ponownie" (useAuth().retry), by nie wyrzucać
  // zalogowanego z ważną sesją przy chwilowej awarii.
  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  if (role && !hasRole(role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <>{children}</>
}
