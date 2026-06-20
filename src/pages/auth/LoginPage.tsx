import { Link } from 'react-router-dom'
import { Brand } from '@/components/layout/Brand'
import { Card } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

export default function LoginPage() {
  return (
    <Card className="rounded-[2rem] p-8 shadow-ambient md:p-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Brand iconOnly className="[&>span]:h-14 [&>span]:w-14" />
        <h1 className="font-headline text-2xl font-bold">Witaj ponownie</h1>
        <p className="text-sm text-on-surface-variant">Zaloguj się do swojego ula.</p>
      </div>
      <p className="rounded-2xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
        Formularz logowania (<code className="text-primary">POST /api/v1/auth/login</code>)
        dodamy w GH-7.
      </p>
      <p className="mt-8 text-center text-sm text-on-surface-variant">
        Nie masz konta?{' '}
        <Link to={ROUTES.register} className="font-bold text-primary hover:underline">
          Załóż konto
        </Link>
      </p>
    </Card>
  )
}
