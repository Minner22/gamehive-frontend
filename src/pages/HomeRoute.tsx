import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Spinner } from '@/components/ui'
import HomePage from './HomePage'
import { ROUTES } from '@/routes/paths'

/**
 * Strona główna zależna od sesji: zalogowany → dashboard (hub), niezalogowany →
 * landing (HomePage z CTA rejestracja/logowanie). Podczas bootstrapu loader.
 */
export default function HomeRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="text-4xl" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <HomePage />
}
