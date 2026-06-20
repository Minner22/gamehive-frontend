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
import { login as apiLogin, logout as apiLogout, refreshSession } from '@/api/auth'
import { getMe } from '@/api/users'
import type { LoginDto, Role, UserResponseDto } from '@/api/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: UserResponseDto | null
  /** Czy trwa wstępne odtwarzanie sesji (przed pierwszym rozstrzygnięciem). */
  isLoading: boolean
  login: (dto: LoginDto) => Promise<void>
  logout: () => Promise<void>
  /** Ponowne pobranie danych użytkownika (np. po edycji profilu). */
  refreshUser: () => Promise<void>
  hasRole: (role: Role) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserResponseDto | null>(null)
  const didBootstrap = useRef(false)

  // Przy starcie: spróbuj odtworzyć sesję z ciasteczka refresh, potem pobierz usera.
  useEffect(() => {
    if (didBootstrap.current) return
    didBootstrap.current = true

    void (async () => {
      try {
        await refreshSession()
        setUser(await getMe())
        setStatus('authenticated')
      } catch {
        setUser(null)
        setStatus('unauthenticated')
      }
    })()
  }, [])

  const login = useCallback(async (dto: LoginDto) => {
    await apiLogin(dto)
    setUser(await getMe())
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await getMe())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isLoading: status === 'loading',
      login,
      logout,
      refreshUser,
      hasRole: (role) => user?.roles?.includes(role) ?? false,
    }),
    [status, user, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
