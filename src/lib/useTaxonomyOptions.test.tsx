import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { ToastProvider } from '@/components/ui'
import { useTaxonomyOptions } from './useTaxonomyOptions'

const CATEGORIES = `${ANY_ORIGIN}/api/v1/taxonomy/categories`
const MECHANICS = `${ANY_ORIGIN}/api/v1/taxonomy/mechanics`

function mockTaxonomy() {
  const calls = { categories: 0, mechanics: 0 }
  server.use(
    http.get(CATEGORIES, () => {
      calls.categories++
      return HttpResponse.json([{ id: 1, name: 'Strategia' }])
    }),
    http.get(MECHANICS, () => {
      calls.mechanics++
      return HttpResponse.json([{ id: 2, name: 'Worker placement' }])
    }),
  )
  return calls
}

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>

describe('useTaxonomyOptions', () => {
  it('zwraca kategorie i mechaniki', async () => {
    mockTaxonomy()
    const { result } = renderHook(() => useTaxonomyOptions(), { wrapper })

    await waitFor(() => expect(result.current.categories).toHaveLength(1))
    expect(result.current.categories[0].name).toBe('Strategia')
    expect(result.current.mechanics[0].name).toBe('Worker placement')
  })

  /**
   * Słowniki są kuratorowane i praktycznie niezmienne, a te same listy potrzebuje
   * biblioteka, wyszukiwarka i dodatki. Bez zapamiętania przejście między nimi
   * wysyłało sześć zapytań o dwie listy.
   */
  it('drugie użycie nie pobiera list ponownie', async () => {
    const calls = mockTaxonomy()

    const first = renderHook(() => useTaxonomyOptions(), { wrapper })
    await waitFor(() => expect(first.result.current.categories).toHaveLength(1))
    expect(calls.categories).toBe(1)

    const second = renderHook(() => useTaxonomyOptions(), { wrapper })
    await waitFor(() => expect(second.result.current.mechanics).toHaveLength(1))

    expect(calls.categories).toBe(1)
    expect(calls.mechanics).toBe(1)
  })

  /** Nieudane pobranie nie może zostać zapamiętane — inaczej filtry byłyby puste do końca sesji. */
  it('po błędzie kolejne użycie próbuje ponownie', async () => {
    let attempts = 0
    server.use(
      http.get(CATEGORIES, () => {
        attempts++
        return attempts === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json([{ id: 1, name: 'Strategia' }])
      }),
      http.get(MECHANICS, () => HttpResponse.json([])),
    )

    const failed = renderHook(() => useTaxonomyOptions(), { wrapper })
    await waitFor(() => expect(attempts).toBe(1))
    expect(failed.result.current.categories).toHaveLength(0)

    // Cache nie zapamiętał porażki, więc kolejne wejście pobiera od nowa.
    const retried = renderHook(() => useTaxonomyOptions(), { wrapper })
    await waitFor(() => expect(retried.result.current.categories).toHaveLength(1))
    expect(attempts).toBe(2)
  })
})
