import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { isAxiosError } from 'axios'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import apiClient, { REFRESH_PATH } from './client'
import { getAccessToken, setAccessToken } from './tokenStore'

/**
 * Odświeżanie sesji w interceptorze — mechanizm, na którym stoi każde żądanie
 * po wygaśnięciu access tokena (15 min). #80 przebudowuje go pod blokadę między
 * kartami, więc te testy pinują zachowanie, które musi przetrwać zmianę.
 */
let refreshCalls = 0

/** Chroniony zasób: wpuszcza tylko świeży token, stary dostaje 401 jak po wygaśnięciu. */
function mockProtected(path = '/api/v1/users/me') {
  server.use(
    http.get(`${ANY_ORIGIN}${path}`, ({ request }) =>
      request.headers.get('Authorization') === 'Bearer fresh'
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ errorCode: 'TOKEN_EXPIRED' }, { status: 401 }),
    ),
  )
}

function mockRefresh(response: () => Response) {
  server.use(
    http.get(`${ANY_ORIGIN}${REFRESH_PATH}`, () => {
      refreshCalls += 1
      return response()
    }),
  )
}

describe('apiClient — odświeżanie na 401', () => {
  beforeEach(() => {
    refreshCalls = 0
    setAccessToken('expired')
  })

  /** Single-flight: trzy żądania z wygasłym tokenem to jedno odświeżenie, nie trzy. */
  it('równoległe 401 czekają na jedno wspólne odświeżenie i ponawiają się z nowym tokenem', async () => {
    mockProtected()
    mockRefresh(() => HttpResponse.json({ accessToken: 'fresh' }))

    const results = await Promise.all([
      apiClient.get('/api/v1/users/me'),
      apiClient.get('/api/v1/users/me'),
      apiClient.get('/api/v1/users/me'),
    ])

    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBe('fresh')
  })

  it('kolejne wygaśnięcie po zakończonym odświeżeniu odświeża ponownie', async () => {
    mockProtected()
    mockRefresh(() => HttpResponse.json({ accessToken: 'fresh' }))

    await apiClient.get('/api/v1/users/me')
    setAccessToken('expired')
    await apiClient.get('/api/v1/users/me')

    expect(refreshCalls).toBe(2)
  })

  it('nieudane odświeżenie czyści token i przekazuje błąd odświeżenia', async () => {
    mockProtected()
    mockRefresh(() => HttpResponse.json({ errorCode: 'TOKEN_REVOKED' }, { status: 401 }))

    const error = await apiClient.get('/api/v1/users/me').catch((e: unknown) => e)

    expect(isAxiosError(error) && error.config?.url).toBe(REFRESH_PATH)
    expect(getAccessToken()).toBeNull()
    expect(refreshCalls).toBe(1)
  })

  /** Złe hasło potwierdzenia to nie wygasły token — ponowienie wysłałoby destrukcyjne żądanie drugi raz (GH-41). */
  it('401 INVALID_PASSWORD nie wyzwala odświeżenia', async () => {
    server.use(
      http.delete(`${ANY_ORIGIN}/api/v1/users/me`, () =>
        HttpResponse.json({ errorCode: 'INVALID_PASSWORD' }, { status: 401 }),
      ),
    )
    mockRefresh(() => HttpResponse.json({ accessToken: 'fresh' }))

    await expect(apiClient.delete('/api/v1/users/me')).rejects.toSatisfy(
      (e: unknown) => isAxiosError(e) && e.response?.status === 401,
    )
    expect(refreshCalls).toBe(0)
  })

  it('401 z samego odświeżenia nie odpala kolejnego odświeżenia (brak pętli)', async () => {
    mockRefresh(() => HttpResponse.json({ errorCode: 'TOKEN_REVOKED' }, { status: 401 }))

    await expect(apiClient.get(REFRESH_PATH)).rejects.toSatisfy(
      (e: unknown) => isAxiosError(e) && e.response?.status === 401,
    )
    expect(refreshCalls).toBe(1)
  })
})
