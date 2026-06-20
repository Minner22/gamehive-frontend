import { applyApiValidationErrors, getApiErrorMessage } from './apiError'

interface HandleApiFormErrorOptions {
  /** Ustaw błąd pola (np. RHF setError). */
  setFieldError: (field: string, message: string) => void
  /** Pokaż komunikat ogólny (np. useToast().error). */
  toastError: (message: string) => void
  /** Predykat pól formularza — błędy spoza nich trafią do toasta, nie w próżnię. */
  isFormField?: (field: string) => boolean
}

/**
 * Wspólna obsługa błędu submitu formularza: błędy walidacji mapuje na pola,
 * a błędy bez pola / ogólne pokazuje toastem (nic nie ginie po cichu).
 */
export function handleApiFormError(
  error: unknown,
  { setFieldError, toastError, isFormField }: HandleApiFormErrorOptions,
): void {
  const { applied, unmapped } = applyApiValidationErrors(error, setFieldError, isFormField)
  unmapped.forEach(toastError)
  if (!applied && unmapped.length === 0) {
    toastError(getApiErrorMessage(error))
  }
}
