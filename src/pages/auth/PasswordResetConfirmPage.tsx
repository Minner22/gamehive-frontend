import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/layout/AuthCard'
import { AuthResult } from '@/components/layout/AuthResult'
import { Button, ButtonLink, PasswordInput } from '@/components/ui'
import { confirmPasswordReset } from '@/api/auth'
import {
  passwordResetConfirmFormSchema,
  type PasswordResetConfirmFormInput,
} from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

// Jedyne pole walidowane przez serwer (token leci z URL, confirm jest kliencki).
const FIELDS = ['newPassword']

export default function PasswordResetConfirmPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [done, setDone] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  const {
    register,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<PasswordResetConfirmFormInput>(
    { resolver: zodResolver(passwordResetConfirmFormSchema) },
    FIELDS,
  )

  // Link bez tokenu lub token odrzucony przez serwer → poproś o nowy.
  if (!token || tokenError) {
    return (
      <AuthCard
        title="Link nieaktualny"
        footer={
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Wróć do logowania
          </Link>
        }
      >
        <AuthResult icon="link_off">
          <p className="text-sm text-on-surface-variant">
            Link do resetu hasła jest nieprawidłowy lub wygasł.
          </p>
          <ButtonLink to={ROUTES.passwordResetRequest} iconRight="send">
            Poproś o nowy link
          </ButtonLink>
        </AuthResult>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Hasło zmienione">
        <AuthResult icon="check_circle">
          <p className="text-sm text-on-surface-variant">
            Możesz zalogować się nowym hasłem.
          </p>
          <ButtonLink to={ROUTES.login} iconRight="login">
            Przejdź do logowania
          </ButtonLink>
        </AuthResult>
      </AuthCard>
    )
  }

  const onSubmit = submit(
    async (data) => {
      await confirmPasswordReset({ token, newPassword: data.newPassword })
      setDone(true)
    },
    (err) => {
      if (!isAxiosError(err)) return false
      const status = err.response?.status
      const data = err.response?.data as { errors?: unknown[] } | undefined
      const hasFieldErrors = Array.isArray(data?.errors) && data.errors.length > 0
      // Token zły/wygasły/użyty: 401 albo 400 bez błędów pól (np. malformed JWT).
      // 400 z błędami pól (np. słabe hasło) → niżej do handleApiFormError.
      if (status === 401 || (status === 400 && !hasFieldErrors)) {
        setTokenError(true)
        return true
      }
      return false
    },
  )

  return (
    <AuthCard title="Ustaw nowe hasło" subtitle="Wybierz nowe hasło do swojego konta.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <PasswordInput
          label="Nowe hasło"
          iconLeft="lock"
          placeholder="Min. 8 znaków"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordInput
          label="Powtórz nowe hasło"
          iconLeft="lock"
          placeholder="Wpisz hasło ponownie"
          autoComplete="new-password"
          error={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} iconRight="check">
          Ustaw nowe hasło
        </Button>
      </form>
    </AuthCard>
  )
}
