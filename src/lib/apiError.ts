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

export interface ApiValidationResult {
  /** Czy choć jeden błąd został przypisany do pola formularza. */
  applied: boolean
  /** Komunikaty, których nie dało się przypisać do pola (brak `field` lub pole
   *  spoza formularza). Pokaż je osobno, np. przez toast — nie znikają po cichu. */
  unmapped: string[]
}

/**
 * Mapuje błędy walidacji z odpowiedzi serwera (ApiValidationError.errors[])
 * na pola formularza przez przekazany callback (np. setError z react-hook-form).
 *
 * Podaj `isFormField`, by błędy dla pól spoza formularza nie trafiały w próżnię —
 * wrócą w `unmapped` zamiast cichego setError na nieistniejące pole.
 */
export function applyApiValidationErrors(
  error: unknown,
  setFieldError: (field: string, message: string) => void,
  isFormField?: (field: string) => boolean,
): ApiValidationResult {
  const unmapped: string[] = []
  if (!isAxiosError(error)) return { applied: false, unmapped }
  const data = error.response?.data as ApiValidationError | undefined
  const fieldErrors = data?.errors
  if (!fieldErrors?.length) return { applied: false, unmapped }

  let applied = false
  for (const fe of fieldErrors) {
    const message = fe.message ?? 'Nieprawidłowa wartość'
    if (fe.field && (!isFormField || isFormField(fe.field))) {
      setFieldError(fe.field, message)
      applied = true
    } else {
      unmapped.push(message)
    }
  }
  return { applied, unmapped }
}
