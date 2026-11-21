import { isAxiosError } from 'axios'
import type { ApiError, ApiValidationError } from '@/api/types'
import {
  ERROR_MESSAGES,
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  errorMessageFor,
} from './errorMessages'

/** Tekst przy polu, gdy serwer odrzucił wartość, a walidacja formularza (zod) jej nie złapała. */
export const FIELD_ERROR_MESSAGE = 'Nieprawidłowa wartość — sprawdź to pole.'

/**
 * Polski komunikat dla użytkownika z błędu zapytania (#81): po `errorCode` z mapy
 * w `errorMessages.ts`, nigdy z `ApiError.message`. Backendowe `message` to
 * angielski opis dla programisty (gamehive-backend#149) — trafia tylko do konsoli.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return GENERIC_ERROR_MESSAGE
  if (!error.response) return NETWORK_ERROR_MESSAGE
  const data = error.response.data as ApiError | ApiValidationError | undefined
  if (data?.message) console.debug(`[api] ${data.errorCode ?? 'bez kodu'}: ${data.message}`)
  return errorMessageFor(data?.errorCode)
}

/**
 * Kod błędu domenowego z odpowiedzi (`ApiError.errorCode`). Po nim rozpoznajemy
 * przypadki, które mają własną obsługę — np. `ALREADY_IN_COLLECTION` czy
 * `BASE_GAME_NOT_APPROVED` — zamiast pokazywać generyczny komunikat.
 */
export function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data as ApiError | undefined)?.errorCode
}

/**
 * Czy 404 mówi „nie ma takiego zasobu" (kod domenowy, np. `GAME_NOT_FOUND`),
 * a nie „nie ma takiej ścieżki". Backend od gamehive-backend#140 odpowiada na
 * nietrafiony adres `404 RESOURCE_NOT_FOUND` — to błąd naszego zapytania, nie
 * brak treści, więc ekran ma pokazać błąd zamiast uprzejmego „nie znaleziono".
 *
 * 404 bez `errorCode` (np. z proxy) liczymy jako domenowe — tak jak przed zmianą,
 * żeby ekrany szczegółów nie zaczęły migać błędem na odpowiedzi spoza backendu.
 */
export function isDomainNotFound(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 404) return false
  return getApiErrorCode(error) !== 'RESOURCE_NOT_FOUND'
}

export interface ApiValidationResult {
  /** Czy choć jeden błąd został przypisany do pola formularza. */
  applied: boolean
  /** Komunikaty dla błędów, których nie dało się przypisać do pola (brak `field` lub
   *  pole spoza formularza) — pokaż je osobno, np. toastem, żeby nie znikały po cichu.
   *  Najwyżej jeden, ogólny: backendowe teksty pól są po angielsku (#81). */
  unmapped: string[]
}

/**
 * Mapuje błędy walidacji z odpowiedzi serwera (ApiValidationError.errors[])
 * na pola formularza przez przekazany callback (np. setError z react-hook-form).
 *
 * Z serwera bierzemy tylko **które** pole odrzucono — tekst jest polski i ogólny
 * (`FIELD_ERROR_MESSAGE`). Backendowe `errors[].message` to angielskie komunikaty
 * Bean Validation; polskie, konkretne teksty daje walidacja formularza (zod),
 * która łapie te same reguły, zanim żądanie w ogóle wyjdzie.
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
  let outsideForm = false
  for (const fe of fieldErrors) {
    if (fe.field && (!isFormField || isFormField(fe.field))) {
      setFieldError(fe.field, FIELD_ERROR_MESSAGE)
      applied = true
    } else {
      outsideForm = true
    }
  }
  if (outsideForm) unmapped.push(ERROR_MESSAGES.VALIDATION_ERROR)
  return { applied, unmapped }
}
