import { useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/layout/AuthCard'
import { AuthResult } from '@/components/layout/AuthResult'
import { Button, Input } from '@/components/ui'
import { requestPasswordReset } from '@/api/auth'
import {
  passwordResetRequestSchema,
  type PasswordResetRequestInput,
} from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

const FIELDS = Object.keys(passwordResetRequestSchema.shape)

export default function PasswordResetRequestPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<PasswordResetRequestInput>(
    { resolver: zodResolver(passwordResetRequestSchema) },
    FIELDS,
  )

  const onSubmit = submit(async (data) => {
    await requestPasswordReset(data)
    setSentTo(data.email)
  })

  if (sentTo) {
    return (
      <AuthCard
        title="Sprawdź skrzynkę"
        footer={
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Wróć do logowania
          </Link>
        }
      >
        <AuthResult icon="mark_email_unread">
          <p className="text-sm text-on-surface-variant">
            Jeśli konto <span className="font-semibold text-on-surface">{sentTo}</span>{' '}
            istnieje, wysłaliśmy link do zresetowania hasła.
          </p>
        </AuthResult>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset hasła"
      subtitle="Podaj e-mail, a wyślemy link do ustawienia nowego hasła."
      footer={
        <>
          Pamiętasz hasło?{' '}
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          label="E-mail"
          iconLeft="mail"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} iconRight="send">
          Wyślij link
        </Button>
      </form>
    </AuthCard>
  )
}
