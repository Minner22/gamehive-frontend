import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/auth/AuthContext'
import { deleteAccount } from '@/api/users'
import type { ApiError } from '@/api/types'
import { Button, Dialog, PasswordInput } from '@/components/ui'
import { deleteAccountSchema, type DeleteAccountInput } from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { clearSession } = useAuth()

  const {
    register,
    setError,
    submit,
    toast,
    formState: { errors, isSubmitting },
  } = useApiForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema) }, ['password'])

  const onSubmit = submit(
    async (data) => {
      await deleteAccount(data)
      clearSession() // serwer unieważnił sesję — czyścimy też stan lokalny
      toast.success('Konto zostało usunięte')
      navigate(ROUTES.home)
    },
    (err) => {
      if (isAxiosError(err)) {
        const code = (err.response?.data as ApiError | undefined)?.errorCode
        if (code === 'INVALID_PASSWORD') {
          setError('password', { message: 'Nieprawidłowe hasło' })
          return true
        }
        if (code === 'CANNOT_REMOVE_LAST_ADMIN') {
          toast.error('Ostatni administrator nie może usunąć własnego konta.')
          return true
        }
      }
      return false
    },
  )

  return (
    <Dialog open onClose={onClose} title="Usuń konto">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div
          role="alert"
          className="rounded-2xl bg-error-container/40 p-3 text-sm text-on-error-container"
        >
          Ta operacja jest <b>trwała i nieodwracalna</b> — konto oraz wszystkie dane
          zostaną usunięte.
        </div>
        <PasswordInput
          label="Potwierdź hasłem"
          iconLeft="lock"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting} iconLeft="delete">
            Usuń konto trwale
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
