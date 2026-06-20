/**
 * Endpointy uwierzytelniania.
 *
 * Konwencja zwrotów: funkcja zwraca `data` z odpowiedzi, jeśli klient jej
 * potrzebuje (np. MessageResponseDto); w przeciwnym razie `void`. `login`
 * zwraca `void`, bo token konsumuje wewnętrznie (setAccessToken).
 */
import apiClient, { REFRESH_PATH } from './client'
import { clearAccessToken, setAccessToken } from './tokenStore'
import type {
  AccessTokenResponseDto,
  LoginDto,
  MessageResponseDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RegistrationDto,
  ResendActivationEmailDto,
} from './types'

/** Logowanie: access token ląduje w pamięci, refresh token w ciasteczku HttpOnly. */
export async function login(dto: LoginDto): Promise<void> {
  const { data } = await apiClient.post<AccessTokenResponseDto>('/api/v1/auth/login', dto)
  setAccessToken(data.accessToken)
}

/** Rejestracja nowego (nieaktywnego) konta — wysyła e-mail aktywacyjny. */
export async function register(dto: RegistrationDto): Promise<MessageResponseDto> {
  const { data } = await apiClient.post<MessageResponseDto>('/api/v1/auth/register', dto)
  return data
}

/** Wylogowanie: unieważnia tokeny po stronie serwera i czyści token lokalny. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/v1/auth/logout')
  } finally {
    clearAccessToken()
  }
}

/** Odświeżenie sesji z ciasteczka refresh — używane przy starcie aplikacji. */
export async function refreshSession(): Promise<string> {
  const { data } = await apiClient.get<AccessTokenResponseDto>(REFRESH_PATH)
  setAccessToken(data.accessToken)
  return data.accessToken
}

/** Aktywacja konta tokenem z linku e-mail. */
export async function activateAccount(token: string): Promise<MessageResponseDto> {
  const { data } = await apiClient.get<MessageResponseDto>('/api/v1/auth/activate', {
    params: { token },
  })
  return data
}

/** Ponowne wysłanie wiadomości aktywacyjnej. */
export async function resendActivation(dto: ResendActivationEmailDto): Promise<void> {
  await apiClient.post('/api/v1/auth/activation/resend', dto)
}

/** Żądanie linku do resetu hasła (odpowiedź zawsze 200). */
export async function requestPasswordReset(dto: PasswordResetRequestDto): Promise<void> {
  await apiClient.post('/api/v1/auth/password-reset/request', dto)
}

/** Ustawienie nowego hasła tokenem resetu. */
export async function confirmPasswordReset(dto: PasswordResetConfirmDto): Promise<void> {
  await apiClient.post('/api/v1/auth/password-reset/confirm', dto)
}
