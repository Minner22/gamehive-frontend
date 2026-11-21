/**
 * Sztuczne Web Locks API (`navigator.locks`) do testów #80 — jsdom go nie ma.
 *
 * Zachowanie jak w przeglądarce dla blokady wyłącznej: wywołania o tej samej nazwie
 * wykonują się po kolei (FIFO), a blokada zwalnia się po zakończeniu funkcji, także
 * błędem. Jedna instancja odgrywa rolę przeglądarki wspólnej dla wielu „kart”.
 *
 * Zwraca funkcję sprzątającą — wołaj ją w `afterEach`, inaczej blokada przecieknie
 * do pozostałych testów (które mają działać na fallbacku, jak dziś).
 */
export function installFakeLocks(): () => void {
  const tails = new Map<string, Promise<unknown>>()
  const locks = {
    request<T>(name: string, callback: () => T | Promise<T>): Promise<T> {
      const previous = tails.get(name) ?? Promise.resolve()
      const run = previous.then(() => callback())
      // Kolejny czeka na zakończenie tego — niezależnie od tego, czy się udało.
      tails.set(
        name,
        run.catch(() => undefined),
      )
      return run
    },
  }
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true })
  return () => {
    Reflect.deleteProperty(navigator, 'locks')
  }
}

/** Przeglądarka bez Web Locks (stara albo bez secure context). */
export function removeLocks(): () => void {
  Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true })
  return () => {
    Reflect.deleteProperty(navigator, 'locks')
  }
}
