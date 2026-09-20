import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import { useResource } from './useResource'

/** Błąd HTTP w kształcie, jaki wystawia axios — hook rozpoznaje po nim 404. */
function httpError(status: number, data: unknown = {}) {
  return new AxiosError('błąd', String(status), undefined, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

function stateOf(error: AxiosError) {
  return renderHook(() => useResource(vi.fn(() => Promise.reject(error))))
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
    const notFound = stateOf(httpError(404, { errorCode: 'GAME_NOT_FOUND' }))
    await waitFor(() => expect(notFound.result.current.state.status).toBe('notFound'))

    const failed = stateOf(httpError(500))
    await waitFor(() => expect(failed.result.current.state.status).toBe('error'))
  })

  /**
   * Nietrafiony adres to błąd naszego zapytania, nie brak treści (backend od
   * gamehive-backend#140 odpowiada na niego `404 RESOURCE_NOT_FOUND`). Gdyby
   * wpadał w `notFound`, literówka w `src/api/*` wyglądałaby jak pusty wynik.
   */
  it('404 RESOURCE_NOT_FOUND daje error, nie notFound', async () => {
    const { result } = stateOf(httpError(404, { errorCode: 'RESOURCE_NOT_FOUND' }))

    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  /** 404 bez kodu (np. z proxy) zostaje przy dotychczasowym zachowaniu. */
  it('404 bez errorCode nadal daje notFound', async () => {
    const { result } = stateOf(httpError(404, ''))

    await waitFor(() => expect(result.current.state.status).toBe('notFound'))
  })

  it('reload pobiera zasób ponownie', async () => {
    const fetchResource = vi.fn(() => Promise.resolve({ id: 1 }))
    const { result } = renderHook(() => useResource(fetchResource))

    await waitFor(() => expect(result.current.state.status).toBe('ok'))
    result.current.reload()

    await waitFor(() => expect(fetchResource).toHaveBeenCalledTimes(2))
  })
})
