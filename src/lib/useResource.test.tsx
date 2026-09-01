import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import { useResource } from './useResource'

/** Błąd HTTP w kształcie, jaki wystawia axios — hook rozpoznaje po nim 404. */
function httpError(status: number) {
  return new AxiosError('błąd', String(status), undefined, null, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('useResource', () => {
  it('kończy się stanem ok z danymi', async () => {
    const fetchResource = vi.fn(() => Promise.resolve({ id: 1 }))
    const { result } = renderHook(() => useResource(fetchResource))

    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { id: 1 } }))
  })

  /**
   * Rozróżnienie 404 od reszty to cały powód istnienia tego hooka: backend
   * odpowiada 404 także na cudze zgłoszenie, więc ekran ma mówić „nie znaleziono".
   */
  it('404 daje notFound, a inne błędy zwykły error', async () => {
    const notFound = renderHook(() => useResource(vi.fn(() => Promise.reject(httpError(404)))))
    await waitFor(() => expect(notFound.result.current.state.status).toBe('notFound'))

    const failed = renderHook(() => useResource(vi.fn(() => Promise.reject(httpError(500)))))
    await waitFor(() => expect(failed.result.current.state.status).toBe('error'))
  })

  it('reload pobiera zasób ponownie', async () => {
    const fetchResource = vi.fn(() => Promise.resolve({ id: 1 }))
    const { result } = renderHook(() => useResource(fetchResource))

    await waitFor(() => expect(result.current.state.status).toBe('ok'))
    result.current.reload()

    await waitFor(() => expect(fetchResource).toHaveBeenCalledTimes(2))
  })
})
