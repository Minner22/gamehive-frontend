import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { FIELD_ERROR_MESSAGE, applyApiValidationErrors, getApiErrorMessage } from './apiError'
import { ERROR_MESSAGES, GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from './errorMessages'

/** Błąd Axios z odpowiedzią — tak, jak dostaje go UI po nieudanym zapytaniu. */
function apiError(status: number, data: unknown): AxiosError {
  const response = { status, data, headers: {}, statusText: '', config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response as AxiosResponse)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getApiErrorMessage', () => {
  it('znany kod daje polski komunikat z mapy', () => {
    expect(getApiErrorMessage(apiError(409, { errorCode: 'ALREADY_IN_COLLECTION' }))).toBe(
      ERROR_MESSAGES.ALREADY_IN_COLLECTION,
    )
  })

  /** Sedno #81: angielskie `message` z backendu nigdy nie trafia do UI. */
  it('nie pokazuje message z backendu — trafia ono tylko do konsoli', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)

    const message = getApiErrorMessage(
      apiError(409, { errorCode: 'ALREADY_IN_COLLECTION', message: 'Item is already in your collection' }),
    )

    expect(message).not.toContain('Item is already')
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('Item is already in your collection'))
  })

  it('nieznany kod ze znaną końcówką dostaje tekst ze wzorca', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    expect(getApiErrorMessage(apiError(404, { errorCode: 'HIVE_NOT_FOUND', message: 'Hive not found' }))).toMatch(
      /Nie znaleziono/,
    )
  })

  it('nieznany kod i odpowiedź bez kodu dają ogólny polski komunikat, nie message', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    expect(getApiErrorMessage(apiError(409, { errorCode: 'SOMETHING_NEW', message: 'English' }))).toBe(
      GENERIC_ERROR_MESSAGE,
    )
    expect(getApiErrorMessage(apiError(502, '<html>Bad Gateway</html>'))).toBe(GENERIC_ERROR_MESSAGE)
  })

  it('brak odpowiedzi to brak połączenia', () => {
    expect(getApiErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(NETWORK_ERROR_MESSAGE)
  })

  it('błąd spoza zapytania daje ogólny komunikat', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe(GENERIC_ERROR_MESSAGE)
  })
})

describe('applyApiValidationErrors', () => {
  const validation = apiError(400, {
    errorCode: 'VALIDATION_ERROR',
    errors: [
      { field: 'email', message: 'Email should be valid' },
      { field: 'unknownField', message: 'Must not be null' },
    ],
  })

  /** Z serwera bierzemy tylko KTÓRE pole odrzucono; polskie teksty daje zod w formularzu. */
  it('przypina błąd do pola polskim tekstem zamiast angielskiego z backendu', () => {
    const set: Record<string, string> = {}

    const result = applyApiValidationErrors(validation, (field, message) => (set[field] = message), (f) => f === 'email')

    expect(set).toEqual({ email: FIELD_ERROR_MESSAGE })
    expect(result.applied).toBe(true)
    expect(result.unmapped).toEqual([ERROR_MESSAGES.VALIDATION_ERROR])
  })

  it('błędy spoza formularza dają jeden ogólny komunikat, nie po jednym na pole', () => {
    const result = applyApiValidationErrors(validation, () => undefined, () => false)

    expect(result).toEqual({ applied: false, unmapped: [ERROR_MESSAGES.VALIDATION_ERROR] })
  })
})
