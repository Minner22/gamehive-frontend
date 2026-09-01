import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page } from '@/api/types'
import { useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

/**
 * Wspólna logika listy stronicowanej (Spring Page): pobranie strony, loader,
 * obsługa błędu (toast) i nawigacja. `fetchPage` powinno być stabilne
 * (useCallback) — jego zmiana (np. nowy zestaw filtrów) wywołuje ponowne pobranie.
 *
 * Stan ładowania ustawiamy w handlerach (zdarzenia), a efekt robi tylko pobranie
 * i setState w callbackach — bez synchronicznego setState w ciele efektu.
 *
 * `initialPage` obsługuje wejście z linku wskazującego dalszą stronę (np. `?page=2`);
 * czytany jest tylko przy montowaniu — dalsze zmiany idą przez `goToPage`.
 */
export function usePaginatedList<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  initialPage = 0,
  /**
   * Własna obsługa błędu; `true` = „obsłużone", wtedy hook nie pokazuje toastu.
   * Ten sam kontrakt co `submit(action, onError?)` w `useApiForm` — potrzebne
   * tam, gdzie konkretny kod błędu ma własny ekran (np. 503 z wyszukiwarki).
   */
  onError?: (error: unknown) => boolean,
) {
  const toast = useToast()
  const [page, setPage] = useState(initialPage)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<Page<T> | null>(null)
  const [loading, setLoading] = useState(true)
  // Ostatnio WCZYTANA strona — przy błędzie cofamy do niej `page`, żeby stan
  // żądania nie rozjechał się z danymi (inaczej ponowny klik trafiałby w tę samą
  // wartość page i efekt by się nie odpalił → zawieszony loader).
  const loadedPage = useRef(initialPage)
  // Callback w refie, nie w zależnościach efektu: inline'owa funkcja z komponentu
  // zmienia tożsamość co render, więc w deps oznaczałaby pobieranie w kółko.
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    let active = true
    fetchPage(page)
      .then((d) => {
        if (!active) return
        setData(d)
        loadedPage.current = d.number
      })
      .catch((err) => {
        if (!active) return
        if (!onErrorRef.current?.(err)) toast.error(getApiErrorMessage(err))
        setPage(loadedPage.current)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [page, reloadKey, fetchPage, toast])

  const goToPage = useCallback((p: number) => {
    setLoading(true)
    setPage(Math.max(p, 0))
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }, [])

  return { data, loading, goToPage, reload, setData }
}
