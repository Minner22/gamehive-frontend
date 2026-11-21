/**
 * Skonfigurowana instancja Axios do komunikacji z GameHive API (Spring Boot).
 *
 * - baseURL pochodzi ze zmiennej środowiskowej VITE_API_BASE_URL,
 * - withCredentials: true — wysyłamy ciasteczko refreshToken (HttpOnly),
 * - request interceptor dokleja nagłówek Authorization: Bearer <accessToken>,
 * - response interceptor przy 401 jednorazowo próbuje odświeżyć token
 *   (GET /api/v1/auth/refresh) i ponawia oryginalne żądanie,
 * - `refreshAccessToken()` to JEDYNA ścieżka odświeżania — używa jej interceptor
 *   i start aplikacji (`refreshSession` w api/auth), patrz niżej.
 */
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AccessTokenResponseDto } from './types'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore'
import { REFRESH_LOCK_NAME, withCrossTabLock } from './crossTabLock'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** Endpoint odświeżania sesji — jedno źródło dla interceptora i api/auth. */
export const REFRESH_PATH = '/api/v1/auth/refresh'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Limit czasu żądania odświeżenia. Odświeżanie jest blokadą wspólną dla kart (#80),
 * więc zawieszone żądanie w jednej karcie wstrzymałoby wszystkie pozostałe —
 * po tym czasie żądanie pada jak błąd sieci, a blokada się zwalnia.
 */
export const REFRESH_TIMEOUT_MS = 15_000

async function requestNewAccessToken(): Promise<string> {
  // Czysta instancja axios — bez interceptorów, żeby uniknąć pętli na 401.
  const { data } = await axios.get<AccessTokenResponseDto>(REFRESH_PATH, {
    baseURL,
    withCredentials: true,
    timeout: REFRESH_TIMEOUT_MS,
  })
  setAccessToken(data.accessToken)
  return data.accessToken
}

// Single-flight: równoległe żądania, które dostały 401, czekają na jedno
// wspólne odświeżenie zamiast wywoływać refresh każde z osobna.
let refreshPromise: Promise<string> | null = null

/**
 * Nowy access token z ciasteczka refresh. Jedna ścieżka dla interceptora i startu
 * aplikacji — inaczej dwie niezależne obietnice mogłyby wysłać ten sam refresh
 * równolegle, a po rotacji refresh tokenów (backend#146) drugi byłby „kradzieżą”.
 *
 * Pod blokadą wspólną dla kart (`crossTabLock`): druga karta czeka, aż pierwsza
 * skończy, i wysyła już nowe ciasteczko. Nieudane odświeżenie czyści token
 * w pamięci i przekazuje błąd dalej.
 */
export function refreshAccessToken(): Promise<string> {
  // Single-flight łączy żądania w karcie, blokada — karty między sobą (#80).
  refreshPromise ??= withCrossTabLock(REFRESH_LOCK_NAME, requestNewAccessToken)
    .catch((error: unknown) => {
      clearAccessToken()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = original?.url ?? ''

    const isRefreshCall = url.includes(REFRESH_PATH)
    // 401 z błędem poświadczeń (np. złe hasło potwierdzenia przy usuwaniu konta)
    // NIE oznacza wygasłego tokenu — nie odświeżamy/nie ponawiamy, tylko zwracamy
    // błąd, żeby UI mógł go zmapować (inaczej destrukcyjny request poszedłby 2×).
    const errorCode = (error.response?.data as { errorCode?: string } | undefined)?.errorCode
    const isCredentialError = errorCode === 'INVALID_PASSWORD'
    const canRetry =
      Boolean(original) && !original?._retry && !isRefreshCall && !isCredentialError

    if (status === 401 && canRetry) {
      original!._retry = true
      // Żądanie wyszło ze starym tokenem, a inne w międzyczasie już odświeżyło sesję —
      // wystarczy ponowić z obecnym. Kolejne odświeżenie byłoby zbędną rotacją refresh
      // tokena (backend#146), a między kartami kolejnym czekaniem na blokadę (#80).
      const current = getAccessToken()
      const sentWith = String(original!.headers?.Authorization ?? '')
      const token =
        current && sentWith !== `Bearer ${current}` ? current : await refreshAccessToken()
      original!.headers = {
        ...original!.headers,
        Authorization: `Bearer ${token}`,
      }
      return apiClient(original!)
    }

    return Promise.reject(error)
  },
)

export default apiClient