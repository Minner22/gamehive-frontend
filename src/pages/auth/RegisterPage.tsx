import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button, Icon, Input, PasswordInput } from '@/components/ui'
import { register as registerUser } from '@/api/auth'
import { registerFormSchema, registerSchema, type RegisterFormInput } from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

// Pola mapowalne na błędy serwera = klucze kontraktu (confirmPassword jest tylko
// po stronie klienta). Wyprowadzone ze schematu, żeby nie rozjechać się przy zmianie.
const REGISTER_FIELDS = Object.keys(registerSchema.shape)

export default function RegisterPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Po sukcesie przenieś fokus na potwierdzenie (dla czytników/klawiatury).
  useEffect(() => {
    if (sentTo) successRef.current?.focus()
  }, [sentTo])

  const {
    register,
    setError,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<RegisterFormInput>(
    { resolver: zodResolver(registerFormSchema) },
    REGISTER_FIELDS,
  )

  const onSubmit = submit(
    async (data) => {
      // confirmPassword to pole tylko po stronie klienta — nie wysyłamy go do API.
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      setSentTo(data.email)
    },
    (err) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('email', { message: 'Konto z tym adresem e-mail już istnieje' })
        return true
      }
      return false
    },
  )

  if (sentTo) {
    return (
      <AuthCard
        title="Sprawdź skrzynkę"
        footer={
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Przejdź do logowania
          </Link>
        }
      >
        <div
          ref={successRef}
          tabIndex={-1}
          className="flex flex-col items-center gap-3 text-center focus:outline-none"
        >
          <span className="hex-flat grid h-14 w-14 place-items-center bg-primary/10">
            <Icon name="mark_email_unread" className="text-2xl text-primary" />
          </span>
          <p className="text-sm text-on-surface-variant">
            Wysłaliśmy link aktywacyjny na{' '}
            <span className="font-semibold text-on-surface">{sentTo}</span>. Kliknij go,
            aby aktywować konto.
          </p>
        </div>
      </AuthCard>
    )
  }

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
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          label="Nazwa użytkownika"
          iconLeft="person"
          placeholder="john.doe"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="E-mail"
          iconLeft="mail"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Hasło"
          iconLeft="lock"
          placeholder="Min. 8 znaków"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Powtórz hasło"
          iconLeft="lock"
          placeholder="Wpisz hasło ponownie"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} iconRight="arrow_forward">
          Załóż konto
        </Button>
      </form>
    </AuthCard>
  )
}
