import { Link } from 'react-router-dom'
import { AuthCard } from '@/components/layout/AuthCard'
import { ROUTES } from '@/routes/paths'

export default function RegisterPage() {
  return (
    <AuthCard
      title="Dołącz do ula"
      subtitle="Załóż konto w GameHive."
      footer={
        <>
          Masz już konto?{' '}
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <p className="rounded-2xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
        Formularz rejestracji (<code className="text-primary">POST /api/v1/auth/register</code>)
        dodamy w GH-6.
      </p>
    </AuthCard>
  )
}
