/**
 * Przechowywanie tokenu dostępowego (access token) w pamięci.
 *
 * Świadomie trzymamy go poza localStorage/sessionStorage — to ogranicza
 * powierzchnię ataku XSS. Token odświeżający (refresh) żyje w ciasteczku
 * HttpOnly ustawianym przez backend, więc po odświeżeniu strony sesję
 * odtwarzamy wołając GET /api/v1/auth/refresh.
 */

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}