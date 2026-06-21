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
 */
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<Page<T>>) {
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<Page<T> | null>(null)
  const [loading, setLoading] = useState(true)
  // Ostatnio WCZYTANA strona — przy błędzie cofamy do niej `page`, żeby stan
  // żądania nie rozjechał się z danymi (inaczej ponowny klik trafiałby w tę samą
  // wartość page i efekt by się nie odpalił → zawieszony loader).
  const loadedPage = useRef(0)

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
        toast.error(getApiErrorMessage(err))
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
