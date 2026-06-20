import { Link } from 'react-router-dom'
import { AuthCard } from '@/components/layout/AuthCard'
import { ROUTES } from '@/routes/paths'

export default function LoginPage() {
  return (
    <AuthCard
      title="Witaj ponownie"
      subtitle="Zaloguj się do swojego ula."
      footer={
        <>
          Nie masz konta?{' '}
          <Link to={ROUTES.register} className="font-bold text-primary hover:underline">
            Załóż konto
          </Link>
        </>
      }
    >
      <p className="rounded-2xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
        Formularz logowania (<code className="text-primary">POST /api/v1/auth/login</code>)
        dodamy w GH-7.
      </p>
    </AuthCard>
  )
}
