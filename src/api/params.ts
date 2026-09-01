/**
 * Wspólne budowanie query stringa dla endpointów listujących.
 *
 * Backend to Spring Data: strona i rozmiar idą jako `page`/`size`, a sortowanie
 * jako **powtórzony** parametr `sort` (`sort=title,asc&sort=id,desc`) — nie tablica.
 */
import type { PageableRequest } from './types'

/** Parametry strony; `sort` pominięty, gdy endpoint sortuje po swojemu (np. ranking). */
export function pageParams({ page = 0, size = 20, sort }: PageableRequest = {}): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  for (const s of sort ?? []) params.append('sort', s)
  return params
}

/**
 * Dokleja filtr tylko wtedy, gdy ma wartość. Pusty string i `undefined` są
 * pomijane — backend traktuje brak parametru jako „bez filtra", a `?x=` jako
 * próbę filtrowania pustą wartością.
 */
export function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined | null,
): void {
  if (value === undefined || value === null || value === '') return
  params.set(key, String(value))
}
