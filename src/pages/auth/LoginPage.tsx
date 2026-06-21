import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button, Input, PasswordInput } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'
import { useApiForm } from '@/lib/useApiForm'
import { loginSchema, type LoginInput } from '@/lib/validation'
import { ROUTES } from '@/routes/paths'

const LOGIN_FIELDS = Object.keys(loginSchema.shape)

type RedirectTarget = { pathname: string; search?: string; hash?: string }

export default function LoginPage() {
  const { status, login } = useAuth()
  const location = useLocation()
  const [inactiveEmail, setInactiveEmail] = useState<string | null>(null)

  // Pełny `from` (pathname + search + hash) zapisany przez ProtectedRoute.
  const from = (location.state as { from?: RedirectTarget } | null)?.from
  const target: RedirectTarget = from ?? { pathname: ROUTES.home }

  const {
    register,
    setError,
    getValues,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<LoginInput>({ resolver: zodResolver(loginSchema) }, LOGIN_FIELDS)

  // Zalogowany na /login → wróć tam, skąd przyszedł (lub na stronę główną).
  if (status === 'authenticated') {
    return <Navigate to={target} replace />
  }

  const onSubmit = submit(
    // Po sukcesie status → 'authenticated' i guard <Navigate to={target}> wyżej
    // przekieruje (na from/home) — bez osobnego navigate().
    async (data) => {
      await login(data)
    },
    (err) => {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('password', { message: 'Nieprawidłowy e-mail lub hasło' })
          return true
        }
        if (err.response?.status === 403) {
          // Konto nieaktywne — pokaż link do ponownego wysłania aktywacji.
          setInactiveEmail(getValues('email'))
          return true
        }
      }
      return false
    },
  )

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
      <form
        onSubmit={(e) => {
          // Wyczyść notkę przed walidacją — także gdy submit padnie na zodzie.
          setInactiveEmail(null)
          void onSubmit(e)
        }}
        className="space-y-5"
        noValidate
      >
        {inactiveEmail && (
          <div
            role="alert"
            className="rounded-2xl bg-error-container/40 p-3 text-sm text-on-error-container"
          >
            Konto nie zostało aktywowane.{' '}
            <Link
              to={ROUTES.activate}
              state={{ email: inactiveEmail }}
              className="font-bold underline"
            >
              Wyślij link aktywacyjny ponownie
            </Link>
          </div>
        )}
        <Input
          label="E-mail"
          iconLeft="mail"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="space-y-1.5">
          <PasswordInput
            label="Hasło"
            iconLeft="lock"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="px-1 text-right">
            <Link
              to={ROUTES.passwordResetRequest}
              className="text-xs font-bold text-primary hover:underline"
            >
              Nie pamiętasz hasła?
            </Link>
          </div>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting} iconRight="login">
          Zaloguj się
        </Button>
      </form>
    </AuthCard>
  )
}
