/**
 * Blokada wspólna dla wszystkich kart tego samego originu (Web Locks API, #80).
 *
 * Po co: ciasteczko refresh jest jedno dla wszystkich kart, a backend po rotacji
 * refresh tokenów (backend#146) traktuje ponowne użycie zrotowanego tokena jak
 * kradzież i wylogowuje ze wszystkich urządzeń. Dwie karty odświeżające naraz
 * wysłałyby ten sam token — pod blokadą druga czeka, aż pierwsza skończy, i wysyła
 * już NOWE ciasteczko, które przeglądarka zdążyła zapisać.
 *
 * Blokada zwalnia się sama, gdy karta się zamknie lub funkcja się zakończy (także
 * błędem). Bez Web Locks (stara przeglądarka, brak secure context — produkcja bez
 * HTTPS) funkcja wykonuje się od razu: zachowanie jak przed #80, czyli single-flight
 * tylko w obrębie karty.
 */

/** Nazwa blokady odświeżania sesji — wspólna dla wszystkich kart GameHive. */
export const REFRESH_LOCK_NAME = 'gamehive-auth-refresh'

export function withCrossTabLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (!locks) return fn()
  return locks.request(name, () => fn())
}
