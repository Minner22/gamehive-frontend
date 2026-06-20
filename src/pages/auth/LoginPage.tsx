import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button, Input, PasswordInput, useToast } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'
import { loginSchema, type LoginInput } from '@/lib/validation'
import { handleApiFormError } from '@/lib/formError'
import { ROUTES } from '@/routes/paths'

const FORM_FIELDS = Object.keys(loginSchema.shape)
const isFormField = (field: string) => FORM_FIELDS.includes(field)

export default function LoginPage() {
  const toast = useToast()
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  // Zalogowany na /login → wróć tam, skąd przyszedł (lub na stronę główną).
  if (status === 'authenticated') {
    return <Navigate to={from ?? ROUTES.home} replace />
  }

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data)
      navigate(from ?? ROUTES.home, { replace: true })
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('password', { message: 'Nieprawidłowy e-mail lub hasło' })
          return
        }
        if (err.response?.status === 403) {
          toast.error('Konto nie zostało aktywowane — sprawdź skrzynkę e-mail.')
          return
        }
      }
      handleApiFormError(err, {
        setFieldError: (field, message) =>
          setError(field as keyof LoginInput, { message }),
        toastError: toast.error,
        isFormField,
      })
    }
  }

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
