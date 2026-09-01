/**
 * Model nadpisań dodatku, w jednym miejscu.
 *
 * Backend zwraca równolegle wartości własne i `effective*`: puste pole własne
 * (`null`) albo pusty zbiór kategorii/mechanik znaczy „dziedziczę z gry bazowej",
 * a wypełnione — „nadpisuję". Reguła jest prosta, ale powtórzona w każdym polu
 * widoku szybko rozjechałaby się z rzeczywistością, więc mieszka tutaj i ma testy.
 */

export interface ValueSource<T> {
  /** Wartość do pokazania — zawsze efektywna, czyli ta, którą realnie gra się przy stole. */
  value: T
  /** `true`, gdy pochodzi z gry bazowej; `false`, gdy dodatek ją nadpisuje. */
  inherited: boolean
}

/** Pole skalarne: `null`/`undefined` po stronie dodatku = dziedziczenie. */
export function resolveValue<T>(own: T | null | undefined, effective: T): ValueSource<T> {
  return { value: effective, inherited: own === null || own === undefined }
}

/** Zbiory (kategorie, mechaniki): pusty własny zbiór = dziedziczenie całości. */
export function resolveCollection<T>(
  own: readonly T[],
  effective: readonly T[],
): ValueSource<readonly T[]> {
  return { value: effective, inherited: own.length === 0 }
}

/** Zakres graczy bywa nadpisany tylko z jednej strony — wtedy nadal jest nadpisaniem. */
export function resolvePlayers(
  ownMin: number | null | undefined,
  ownMax: number | null | undefined,
  effectiveMin: number,
  effectiveMax: number,
): ValueSource<string> {
  const label = effectiveMin === effectiveMax ? `${effectiveMin}` : `${effectiveMin}–${effectiveMax}`
  return {
    value: label,
    inherited: (ownMin === null || ownMin === undefined) && (ownMax === null || ownMax === undefined),
  }
}
