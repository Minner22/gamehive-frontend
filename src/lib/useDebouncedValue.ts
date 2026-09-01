import { useEffect, useState } from 'react'

/** Domyślne opóźnienie: tyle wystarcza, by nie strzelać zapytaniem na każdą literę. */
const DEFAULT_DELAY_MS = 300

/**
 * Zwraca wartość opóźnioną — zmienia się dopiero, gdy `value` przestanie się
 * zmieniać przez `delay` milisekund. Używane w wyszukiwarce: pole reaguje
 * natychmiast, a zapytanie leci raz, po skończeniu pisania.
 */
export function useDebouncedValue<T>(value: T, delay = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
