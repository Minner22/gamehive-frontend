/**
 * Skonfigurowana instancja Axios do komunikacji z GameHive API (Spring Boot).
 *
 * - baseURL pochodzi ze zmiennej środowiskowej VITE_API_BASE_URL,
 * - withCredentials: true — wysyłamy ciasteczko refreshToken (HttpOnly),
 * - request interceptor dokleja nagłówek Authorization: Bearer <accessToken>,
 * - response interceptor przy 401 jednorazowo próbuje odświeżyć token
 *   (GET /api/v1/auth/refresh) i ponawia oryginalne żądanie.
 */
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AccessTokenResponseDto } from './types'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore'

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

// Single-flight: równoległe żądania, które dostały 401, czekają na jedno
// wspólne odświeżenie zamiast wywoływać refresh każde z osobna.
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  // Czysta instancja axios — bez interceptorów, żeby uniknąć pętli na 401.
  const { data } = await axios.get<AccessTokenResponseDto>(REFRESH_PATH, {
    baseURL,
    withCredentials: true,
  })
  setAccessToken(data.accessToken)
  return data.accessToken
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
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const token = await refreshPromise
        original!.headers = {
          ...original!.headers,
          Authorization: `Bearer ${token}`,
        }
        return apiClient(original!)
      } catch (refreshError) {
        clearAccessToken()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient