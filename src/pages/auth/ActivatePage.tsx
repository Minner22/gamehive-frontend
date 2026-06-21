import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthCard } from '@/components/layout/AuthCard'
import { AuthResult } from '@/components/layout/AuthResult'
import { Button, ButtonLink, Input, Spinner } from '@/components/ui'
import { activateAccount, resendActivation } from '@/api/auth'
import { resendActivationSchema, type ResendActivationInput } from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

type ActivationState = 'activating' | 'success' | 'error' | 'no-token'

const RESEND_FIELDS = Object.keys(resendActivationSchema.shape)

/** Formularz ponownego wysłania linku aktywacyjnego (odpowiedź zawsze „przyjęto"). */
function ResendForm({ defaultEmail }: { defaultEmail: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    submit,
    formState: { errors, isSubmitting },
  } = useApiForm<ResendActivationInput>(
    { resolver: zodResolver(resendActivationSchema), defaultValues: { email: defaultEmail } },
    RESEND_FIELDS,
  )

  const onSubmit = submit(async (data) => {
    await resendActivation(data)
    setSentTo(data.email)
  })

  if (sentTo) {
    return (
      <AuthResult>
        <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Jeśli konto <span className="font-semibold text-on-surface">{sentTo}</span> istnieje
          i nie jest aktywne, wysłaliśmy nowy link aktywacyjny.
        </p>
      </AuthResult>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        Wyślij link ponownie
      </Button>
    </form>
  )
}

export default function ActivatePage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const location = useLocation()
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? ''

  const [state, setState] = useState<ActivationState>(token ? 'activating' : 'no-token')
  const didRun = useRef(false)

  useEffect(() => {
    if (!token || didRun.current) return
    didRun.current = true
    // Błędy tokena (400/401) są nieakcjonowalne dla użytkownika — pokazujemy
    // jeden przyjazny komunikat zamiast surowej wiadomości serwera.
    activateAccount(token)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  if (state === 'activating') {
    return (
      <AuthCard title="Aktywacja konta">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <Spinner className="text-4xl" />
          <p className="text-sm text-on-surface-variant">Aktywujemy Twoje konto…</p>
        </div>
      </AuthCard>
    )
  }

  if (state === 'success') {
    return (
      <AuthCard title="Konto aktywowane">
        <AuthResult icon="check_circle">
          <p className="text-sm text-on-surface-variant">
            Możesz się już zalogować do GameHive.
          </p>
          <ButtonLink to={ROUTES.login} iconRight="login">
            Przejdź do logowania
          </ButtonLink>
        </AuthResult>
      </AuthCard>
    )
  }

  // 'error' lub 'no-token' → komunikat kontekstowy + formularz ponownego wysłania.
  return (
    <AuthCard
      title={state === 'error' ? 'Link nieaktualny' : 'Aktywacja konta'}
      subtitle={
        state === 'error'
          ? 'Link aktywacyjny jest nieprawidłowy lub wygasł. Wyślij nowy poniżej.'
          : 'Wpisz adres e-mail, aby otrzymać nowy link aktywacyjny.'
      }
      footer={
        <>
          Konto jest już aktywne?{' '}
          <Link to={ROUTES.login} className="font-bold text-primary hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <ResendForm defaultEmail={prefillEmail} />
    </AuthCard>
  )
}
