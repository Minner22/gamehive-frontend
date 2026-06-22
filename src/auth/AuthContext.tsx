import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isAxiosError } from 'axios'
import { login as apiLogin, logout as apiLogout, refreshSession } from '@/api/auth'
import { getMe } from '@/api/users'
import { clearAccessToken } from '@/api/tokenStore'
import type { LoginDto, Role, UserResponseDto } from '@/api/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

interface AuthContextValue {
  /** 'error' = nie udało się połączyć przy starcie (transient) — patrz retry(). */
  status: AuthStatus
  user: UserResponseDto | null
  login: (dto: LoginDto) => Promise<void>
  logout: () => Promise<void>
  /** Ponowne pobranie danych użytkownika (np. po edycji profilu). */
  refreshUser: () => Promise<void>
  /** Ponowna próba odtworzenia sesji po stanie 'error'. */
  retry: () => Promise<void>
  /** Wyczyszczenie sesji lokalnie, gdy serwer już ją zakończył (np. po usunięciu konta). */
  clearSession: () => void
  hasRole: (role: Role) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>')
  return ctx
}

function isUnauthorized(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserResponseDto | null>(null)
  const didBootstrap = useRef(false)

  // Odtworzenie sesji z ciasteczka refresh. Rozróżnia brak sesji (401) od
  // błędu przejściowego (sieć/5xx) — ten drugi NIE wylogowuje na stałe.
  const bootstrap = useCallback(async () => {
    setStatus('loading')
    try {
      await refreshSession()
      setUser(await getMe())
      setStatus('authenticated')
    } catch (error) {
      clearAccessToken()
      setUser(null)
      setStatus(isUnauthorized(error) ? 'unauthenticated' : 'error')
    }
  }, [])

  useEffect(() => {
    if (didBootstrap.current) return // pomiń podwójny efekt StrictMode
    didBootstrap.current = true
    void bootstrap()
  }, [bootstrap])

  // Wyczyszczenie sesji lokalnie (token + stan), gdy serwer ją zakończył lub gdy
  // sprzątamy po nieudanym logowaniu/wylogowaniu. Jedno źródło sprzątania sesji.
  const clearSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const login = useCallback(
    async (dto: LoginDto) => {
      // Błędy poświadczeń/aktywacji (401/403) lecą z apiLogin jako AxiosError —
      // strona logowania mapuje je po statusie.
      await apiLogin(dto)
      try {
        setUser(await getMe())
        setStatus('authenticated')
      } catch (error) {
        // Token był ustawiony przez apiLogin — przy błędzie getMe sprzątamy.
        // Owijamy w zwykły błąd (nie AxiosError), żeby strona logowania NIE
        // pomyliła awarii pobrania profilu z błędem poświadczeń (np. getMe 401).
        clearSession()
        throw new Error('Nie udało się pobrać danych konta po zalogowaniu.', {
          cause: error,
        })
      }
    },
    [clearSession],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Wylogowanie zawsze udaje się lokalnie — błąd serwera ignorujemy.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const refreshUser = useCallback(async () => {
    setUser(await getMe())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      refreshUser,
      retry: bootstrap,
      clearSession,
      hasRole: (role) => user?.roles?.includes(role) ?? false,
    }),
    [status, user, login, logout, refreshUser, bootstrap, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
