import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES, GENERIC_ERROR_MESSAGE, errorMessageFor } from './errorMessages'

const codes = Object.keys(ERROR_MESSAGES)

describe('errorMessageFor', () => {
  it('zna wszystkie 77 kodów backendu (ErrorCode.java)', () => {
    expect(codes).toHaveLength(77)
  })

  it.each(codes)('%s ma własny, konkretny komunikat', (code) => {
    expect(errorMessageFor(code)).not.toBe(GENERIC_ERROR_MESSAGE)
  })

  /**
   * Prosta kontrola, że żaden tekst nie został przepisany 1:1 z angielskiego
   * `defaultMessage` backendu — po to jest ta mapa.
   */
  it.each(codes)('%s jest po polsku, nie po angielsku', (code) => {
    expect(errorMessageFor(code)).not.toMatch(/\b(the|is|not|already|invalid|failed|cannot|required)\b/i)
  })

  /** Backend dodał kod, którego mapa jeszcze nie zna — wspólna końcówka daje sensowny tekst. */
  it.each([
    ['HIVE_NOT_FOUND', /Nie znaleziono/],
    ['HIVE_IN_USE', /w użyciu/],
    ['HIVE_NAME_EXISTS', /już istnieje/],
    ['HIVE_NOT_PENDING', /decyzję/],
    ['REFRESH_TOKEN_REUSED', /Sesja wygasła/],
    ['JWT_SOMETHING_NEW', /Sesja wygasła/],
  ])('nieznany %s dostaje tekst ze wzorca', (code, expected) => {
    expect(errorMessageFor(code)).toMatch(expected)
  })

  it('zupełnie nieznany kod i brak kodu dają ogólny polski komunikat', () => {
    expect(errorMessageFor('SOMETHING_ELSE')).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessageFor(undefined)).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessageFor('')).toBe(GENERIC_ERROR_MESSAGE)
  })

  it('nazwy z prototypu obiektu nie udają znanych kodów', () => {
    expect(errorMessageFor('toString')).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessageFor('constructor')).toBe(GENERIC_ERROR_MESSAGE)
  })
})
