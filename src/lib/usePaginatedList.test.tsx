import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Page } from '@/api/types'
import { ToastProvider } from '@/components/ui'
import { usePaginatedList } from './usePaginatedList'

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>

const makePage = (number: number, content: string[] = ['x']): Page<string> => ({
  content,
  totalPages: 3,
  totalElements: 25,
  size: 10,
  number,
  numberOfElements: content.length,
  first: number === 0,
  last: number >= 2,
  empty: content.length === 0,
})

describe('usePaginatedList', () => {
  it('pobiera pierwszą stronę i kończy ładowanie', async () => {
    const fetchPage = vi.fn((p: number) => Promise.resolve(makePage(p)))
    const { result } = renderHook(() => usePaginatedList(fetchPage), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchPage).toHaveBeenCalledWith(0)
    expect(result.current.data?.number).toBe(0)
  })

  it('goToPage przełącza stronę', async () => {
    const fetchPage = vi.fn((p: number) => Promise.resolve(makePage(p)))
    const { result } = renderHook(() => usePaginatedList(fetchPage), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.goToPage(1))
    await waitFor(() => expect(result.current.data?.number).toBe(1))
    expect(fetchPage).toHaveBeenCalledWith(1)
  })

  it('błąd pobrania nie zawiesza loadera i zachowuje ostatnie dobre dane', async () => {
    const fetchPage = vi.fn((p: number) => Promise.resolve(makePage(p)))
    const { result } = renderHook(() => usePaginatedList(fetchPage), { wrapper })
    await waitFor(() => expect(result.current.data?.number).toBe(0))

    // Następne pobranie (strona 1) pada → rollback page do ostatnio wczytanej (0).
    fetchPage.mockRejectedValueOnce(new Error('boom'))
    act(() => result.current.goToPage(1))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.number).toBe(0)
  })
})
