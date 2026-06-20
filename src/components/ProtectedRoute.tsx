import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '@/api/tokenStore'
import { ROUTES } from '@/routes/paths'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Prosta bramka dla tras wymagających zalogowania.
 *
 * Na tym etapie sprawdzamy jedynie obecność tokenu w pamięci. Docelowo
 * (patrz roadmapa) zastąpi to kontekst uwierzytelnienia, który przy starcie
 * aplikacji spróbuje odświeżyć sesję z ciasteczka HttpOnly.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()

  if (!getAccessToken()) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <>{children}</>
}