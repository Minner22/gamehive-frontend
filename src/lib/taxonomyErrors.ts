import { isAxiosError } from 'axios'
import type { ApiValidationError } from '@/api/types'
import { getApiErrorCode, getApiErrorMessage } from './apiError'

/**
 * Komunikaty błędów słowników taksonomii.
 *
 * Kody mają wspólne końcówki dla wszystkich czterech słowników
 * (`CATEGORY_IN_USE`, `PUBLISHER_IN_USE`…, `CATEGORY_NAME_EXISTS`…), więc
 * dopasowujemy po sufiksie zamiast wyliczać każdy kod osobno.
 */
export function taxonomyErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error)
  if (code?.endsWith('_IN_USE')) {
    return 'Pozycja jest używana przez grę lub dodatek — najpierw odepnij ją od treści.'
  }
  if (code?.endsWith('_EXISTS')) {
    return 'Taka pozycja już jest w słowniku.'
  }
  // 400 VALIDATION_ERROR niesie komunikat przy polu — ogólne „Validation failed" nic nie mówi.
  if (isAxiosError(error)) {
    const fieldMessage = (error.response?.data as ApiValidationError | undefined)?.errors?.[0]
      ?.message
    if (fieldMessage) return fieldMessage
  }
  return getApiErrorMessage(error)
}
