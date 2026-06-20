import type { BaseSyntheticEvent } from 'react'
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import { useToast } from '@/components/ui'
import { handleApiFormError } from './formError'

interface UseApiFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  toast: ReturnType<typeof useToast>
  /**
   * Owija submit. Po błędzie najpierw woła `onError` (zwróć `true`, jeśli błąd
   * obsłużony — np. specjalny status), inaczej domyślnie mapuje go przez
   * handleApiFormError (błędy walidacji → pola, reszta → toast).
   */
  submit: (
    action: (data: T) => Promise<void> | void,
    onError?: (error: unknown) => boolean,
  ) => (e?: BaseSyntheticEvent) => Promise<void>
}

/**
 * Wspólny szkielet formularzy uderzających w API: useForm + zod resolver +
 * jednolita obsługa błędów. Likwiduje powtarzany boilerplate (ekrany auth).
 *
 * @param formFields nazwy pól mapowalnych na błędy serwera (zwykle
 *   `Object.keys(schema.shape)` schematu-obiektu).
 */
export function useApiForm<T extends FieldValues>(
  props: UseFormProps<T>,
  formFields: readonly string[],
): UseApiFormReturn<T> {
  const form = useForm<T>(props)
  const toast = useToast()
  const isFormField = (field: string) => formFields.includes(field)

  const submit: UseApiFormReturn<T>['submit'] = (action, onError) =>
    form.handleSubmit(async (data) => {
      try {
        await action(data)
      } catch (error) {
        if (onError?.(error)) return
        handleApiFormError(error, {
          setFieldError: (field, message) =>
            form.setError(field as Path<T>, { message }),
          toastError: toast.error,
          isFormField,
        })
      }
    })

  return { ...form, toast, submit }
}
