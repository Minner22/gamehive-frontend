import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import axios, { isAxiosError } from 'axios'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { refreshSession } from './auth'
import apiClient, { REFRESH_PATH, REFRESH_TIMEOUT_MS } from './client'
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

  /**
   * Start aplikacji (`refreshSession`) i 401 w trakcie pracy szły kiedyś dwiema
   * niezależnymi ścieżkami. Po rotacji refresh tokenów (backend#146) dwa równoległe
   * odświeżenia to „kradzież” i globalne wylogowanie — muszą się łączyć w jedno.
   */
  it('odświeżenie przy starcie i odświeżenie z interceptora łączą się w jedno', async () => {
    // 401 na żądanie wysłane ze starym tokenem może przyjść już PO odświeżeniu —
    // wtedy interceptor ponawia z nowym tokenem zamiast odświeżać drugi raz.
    mockProtected()
    mockRefresh(() => HttpResponse.json({ accessToken: 'fresh' }))

    const [token, response] = await Promise.all([refreshSession(), apiClient.get('/api/v1/users/me')])

    expect(token).toBe('fresh')
    expect(response.status).toBe(200)
    expect(refreshCalls).toBe(1)
  })
})

describe('apiClient — limit czasu odświeżenia', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Odświeżanie blokuje wszystkie karty (#80) — zawieszone żądanie nie może trzymać
   * blokady w nieskończoność. Samo przerwanie po czasie to odpowiedzialność axiosa
   * (XHR w jsdom nie reaguje na sztuczny zegar), tu pinujemy, że limit jest ustawiony.
   */
  it('odświeżenie wychodzi z limitem czasu', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { accessToken: 'fresh' } })

    await expect(refreshSession()).resolves.toBe('fresh')

    expect(get).toHaveBeenCalledWith(REFRESH_PATH, expect.objectContaining({ timeout: REFRESH_TIMEOUT_MS }))
  })

  it('po nieudanym odświeżeniu kolejna próba to nowe żądanie, nie ta sama obietnica', async () => {
    let calls = 0
    server.use(
      http.get(`${ANY_ORIGIN}${REFRESH_PATH}`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json({ accessToken: 'fresh' })
      }),
    )

    await expect(refreshSession()).rejects.toBeTruthy()
    await expect(refreshSession()).resolves.toBe('fresh')
    expect(calls).toBe(2)
  })
})
