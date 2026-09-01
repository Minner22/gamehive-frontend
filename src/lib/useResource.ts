import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'

/**
 * Stan pojedynczego zasobu. `notFound` jest osobnym przypadkiem, a nie zwykłym
 * błędem, bo backend odpowiada 404 także na cudze zgłoszenie (ochrona przed
 * enumeracją) — ekran musi wtedy mówić „nie znaleziono", nigdy „brak uprawnień".
 */
export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'notFound' }
  | { status: 'error' }

/**
 * Odpowiednik `usePaginatedList` dla pojedynczego zasobu: pobranie, stan
 * ładowania, rozróżnienie 404 od pozostałych błędów i ponowienie.
 *
 * `fetchResource` musi być stabilne (`useCallback`) — jego zmiana (np. inne id
 * w adresie) powoduje ponowne pobranie.
 */
export function useResource<T>(fetchResource: () => Promise<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  // Poprzedni wynik zostaje na ekranie do czasu nadejścia nowego (bez migotania
  // szkieletem przy ponowieniu); stan startowy i tak jest `loading`.
  useEffect(() => {
    let active = true
    fetchResource()
      .then((data) => active && setState({ status: 'ok', data }))
      .catch((err) => {
        if (!active) return
        const notFound = isAxiosError(err) && err.response?.status === 404
        setState({ status: notFound ? 'notFound' : 'error' })
      })
    return () => {
      active = false
    }
  }, [fetchResource, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { state, reload }
}
