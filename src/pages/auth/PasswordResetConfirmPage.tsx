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
import { getApiErrorCode } from '@/lib/apiError'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

// Jedyne pole walidowane przez serwer (token leci z URL, confirm jest kliencki).
const FIELDS = ['newPassword']

/** Dlaczego link nie działa — każdy powód ma inną radę dla użytkownika (#88). */
type LinkProblem = 'revoked' | 'used' | 'invalid'

/**
 * Teksty lokalne, nie z `errorMessages.ts`: tam `TOKEN_REVOKED` znaczy unieważnioną
 * sesję, a tu — link z maila zastąpiony nowszym (backend#145).
 */
const LINK_PROBLEMS: Record<LinkProblem, { icon: string; text: string }> = {
  revoked: {
    icon: 'mark_email_unread',
    text: 'Ten link został zastąpiony nowszym albo hasło zostało już zmienione. Użyj linku z najnowszej wiadomości albo poproś o nowy.',
  },
  used: {
    icon: 'task_alt',
    text: 'Ten link został już użyty. Zaloguj się nowym hasłem albo poproś o nowy link.',
  },
  invalid: {
    icon: 'link_off',
    text: 'Link do resetu hasła jest nieprawidłowy lub wygasł.',
  },
}

function linkProblemFor(errorCode: string | undefined): LinkProblem {
  if (errorCode === 'TOKEN_REVOKED') return 'revoked'
  if (errorCode === 'JWT_BLACKLISTED') return 'used'
  return 'invalid'
}

export default function PasswordResetConfirmPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [done, setDone] = useState(false)
  const [linkProblem, setLinkProblem] = useState<LinkProblem | null>(null)

  const {
    register,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<PasswordResetConfirmFormInput>(
    { resolver: zodResolver(passwordResetConfirmFormSchema) },
    FIELDS,
  )

  // Link bez tokenu lub token odrzucony przez serwer → wyjaśnij dlaczego i co dalej.
  if (!token || linkProblem) {
    const problem = linkProblem ?? 'invalid'
    // Użyty link zwykle znaczy „hasło już ustawione” — wtedy logowanie jest pierwszym krokiem.
    const loginFirst = problem === 'used'
    return (
      <AuthCard
        title="Link nieaktualny"
        footer={
          loginFirst ? undefined : (
            <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
              Wróć do logowania
            </Link>
          )
        }
      >
        <AuthResult icon={LINK_PROBLEMS[problem].icon}>
          <p className="text-sm text-on-surface-variant">{LINK_PROBLEMS[problem].text}</p>
          {loginFirst && (
            <ButtonLink to={ROUTES.login} iconRight="login">
              Przejdź do logowania
            </ButtonLink>
          )}
          <ButtonLink
            to={ROUTES.passwordResetRequest}
            iconRight="send"
            variant={loginFirst ? 'tertiary' : 'primary'}
          >
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
      // Token zły/wygasły/użyty/zastąpiony: 401 albo 400 bez błędów pól (np. malformed JWT).
      // 400 z błędami pól (np. słabe hasło) → niżej do handleApiFormError.
      if (status === 401 || (status === 400 && !hasFieldErrors)) {
        setLinkProblem(linkProblemFor(status === 401 ? getApiErrorCode(err) : undefined))
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
