import { isAxiosError } from 'axios'
import type { ApiError, ApiValidationError } from '@/api/types'

/**
 * Wyciąga czytelny komunikat z błędu Axios (ApiError / ApiValidationError),
 * z sensownym fallbackiem dla braku połączenia i błędów bez treści.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Coś poszło nie tak. Spróbuj ponownie.',
): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Brak połączenia z serwerem.'
    const data = error.response.data as ApiError | ApiValidationError | undefined
    if (data?.message) return data.message
  }
  return fallback
}

/**
 * Mapuje błędy walidacji z odpowiedzi serwera (ApiValidationError.errors[])
 * na poszczególne pola formularza przez przekazany callback (np. setError z
 * react-hook-form). Zwraca true, jeśli choć jeden błąd polowy został zastosowany.
 */
export function applyApiValidationErrors(
  error: unknown,
  setFieldError: (field: string, message: string) => void,
): boolean {
  if (!isAxiosError(error)) return false
  const data = error.response?.data as ApiValidationError | undefined
  const fieldErrors = data?.errors
  if (!fieldErrors?.length) return false

  let applied = false
  for (const fe of fieldErrors) {
    if (fe.field) {
      setFieldError(fe.field, fe.message ?? 'Nieprawidłowa wartość')
      applied = true
    }
  }
  return applied
}
