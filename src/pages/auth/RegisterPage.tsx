import { Link } from 'react-router-dom'
import { Brand } from '@/components/layout/Brand'
import { Card } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

export default function RegisterPage() {
  return (
    <Card className="rounded-[2rem] p-8 shadow-ambient md:p-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Brand iconOnly className="[&>span]:h-14 [&>span]:w-14" />
        <h1 className="font-headline text-2xl font-bold">Dołącz do ula</h1>
        <p className="text-sm text-on-surface-variant">Załóż konto w GameHive.</p>
      </div>
      <p className="rounded-2xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
        Formularz rejestracji (<code className="text-primary">POST /api/v1/auth/register</code>)
        dodamy w GH-6.
      </p>
      <p className="mt-8 text-center text-sm text-on-surface-variant">
        Masz już konto?{' '}
        <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
          Zaloguj się
        </Link>
      </p>
    </Card>
  )
}
