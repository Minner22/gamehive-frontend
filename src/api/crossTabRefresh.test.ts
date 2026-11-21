import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { installFakeLocks, removeLocks } from '@/test/fakeLocks'

/**
 * Dwie karty przeglądarki (#80). Każda karta to osobna kopia modułów (`vi.resetModules`):
 * własny access token w pamięci i własny single-flight — dokładnie jak dwie prawdziwe
 * karty. Wspólne mają tylko to, co w przeglądarce jest wspólne: blokadę Web Locks
 * (sztuczną, `installFakeLocks`) i serwer.
 *
 * Serwer liczy, ile odświeżeń trwa jednocześnie. Po rotacji refresh tokenów
 * (backend#146) dwa naraz to ten sam token wysłany dwa razy, czyli „kradzież”
 * i wylogowanie ze wszystkich urządzeń — dlatego kryterium to `maxInFlight === 1`.
 */
const REFRESH = '/api/v1/auth/refresh'
const PROTECTED = '/api/v1/users/me'

let inFlight = 0
let maxInFlight = 0
let issued = 0
let failNext = false

async function openTab() {
  vi.resetModules()
  const client = await import('./client')
  const auth = await import('./auth')
  const store = await import('./tokenStore')
  return { apiClient: client.default, refreshSession: auth.refreshSession, store }
}

let cleanupLocks: () => void = () => undefined

beforeEach(() => {
  inFlight = 0
  maxInFlight = 0
  issued = 0
  failNext = false
  server.use(
    http.get(`${ANY_ORIGIN}${REFRESH}`, async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await delay(30)
      inFlight -= 1
      if (failNext) {
        failNext = false
        return HttpResponse.error()
      }
      issued += 1
      // Każde odświeżenie to nowa rotacja — nowy, unikalny token.
      return HttpResponse.json({ accessToken: `token-${issued}` })
    }),
    http.get(`${ANY_ORIGIN}${PROTECTED}`, ({ request }) =>
      request.headers.get('Authorization')?.startsWith('Bearer token-')
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ errorCode: 'TOKEN_EXPIRED' }, { status: 401 }),
    ),
  )
})

afterEach(() => cleanupLocks())

describe('odświeżanie sesji między kartami', () => {
  it('dwie karty z wygasłym tokenem odświeżają po kolei i obie zostają zalogowane', async () => {
    cleanupLocks = installFakeLocks()
    const tabA = await openTab()
    const tabB = await openTab()
    tabA.store.setAccessToken('expired')
    tabB.store.setAccessToken('expired')

    const [a, b] = await Promise.all([tabA.apiClient.get(PROTECTED), tabB.apiClient.get(PROTECTED)])

    expect([a.status, b.status]).toEqual([200, 200])
    expect(maxInFlight).toBe(1)
    expect(issued).toBe(2)
    // Każda karta ma własny, świeży token z kolejnej rotacji.
    expect(new Set([tabA.store.getAccessToken(), tabB.store.getAccessToken()])).toEqual(
      new Set(['token-1', 'token-2']),
    )
  })

  /** Start aplikacji w dwóch kartach naraz (np. przywrócenie przeglądarki). */
  it('dwie karty startujące naraz przechodzą przez blokadę', async () => {
    cleanupLocks = installFakeLocks()
    const tabA = await openTab()
    const tabB = await openTab()

    await Promise.all([tabA.refreshSession(), tabB.refreshSession()])

    expect(maxInFlight).toBe(1)
    expect(issued).toBe(2)
  })

  it('w obrębie karty single-flight dalej łączy żądania — blokada nie mnoży odświeżeń', async () => {
    cleanupLocks = installFakeLocks()
    const tabA = await openTab()
    const tabB = await openTab()
    tabA.store.setAccessToken('expired')
    tabB.store.setAccessToken('expired')

    await Promise.all([
      tabA.apiClient.get(PROTECTED),
      tabA.apiClient.get(PROTECTED),
      tabB.apiClient.get(PROTECTED),
      tabB.apiClient.get(PROTECTED),
    ])

    expect(issued).toBe(2) // jedno na kartę, nie jedno na żądanie
    expect(maxInFlight).toBe(1)
  })

  it('nieudane odświeżenie pierwszej karty nie blokuje drugiej', async () => {
    cleanupLocks = installFakeLocks()
    const tabA = await openTab()
    const tabB = await openTab()
    failNext = true

    const [a, b] = await Promise.allSettled([tabA.refreshSession(), tabB.refreshSession()])

    expect(a.status).toBe('rejected')
    expect(b).toEqual({ status: 'fulfilled', value: 'token-1' })
    expect(maxInFlight).toBe(1)
  })

  /**
   * Bez Web Locks (stara przeglądarka, brak HTTPS) zostaje zachowanie sprzed #80:
   * karty odświeżają równolegle. Ten test dokumentuje, przed czym chroni blokada.
   */
  it('bez Web Locks karty odświeżają równolegle (fallback sprzed #80)', async () => {
    cleanupLocks = removeLocks()
    const tabA = await openTab()
    const tabB = await openTab()

    await Promise.all([tabA.refreshSession(), tabB.refreshSession()])

    expect(maxInFlight).toBe(2)
  })
})
