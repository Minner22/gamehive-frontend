---
name: auth-session
description: Ekspert sesji i uwierzytelniania frontu GameHive — access token tylko w pamięci (src/api/tokenStore.ts), refresh token w ciasteczku HttpOnly, interceptor Axios w src/api/client.ts (Bearer + single-flight refresh na 401, wyjątek INVALID_PASSWORD, czysta instancja do refresh), AuthProvider/useAuth (bootstrap refreshSession → getMe, statusy loading/authenticated/unauthenticated/error, retry, clearSession, hasRole), ProtectedRoute i HomeRoute, ekrany auth (login, rejestracja, aktywacja, reset hasła). Użyj ZAWSZE przed zmianą w client.ts, tokenStore.ts, AuthContext.tsx, ProtectedRoute.tsx lub src/pages/auth, przy pracy nad #80 (odświeżanie między kartami, rotacja refresh tokenów backend#146), przy "dlaczego wylogowało", "pętla 401", "ekran Spróbuj ponownie" oraz przed /security-review.
---

# Sesja i uwierzytelnianie

Backendowy odpowiednik: skill `auth-expert` w `gamehive-backend` (typy JWT, Redis, blacklist JTI, epoki sesji). Kontrakt `/api/v1/auth/**` czytaj tam.

## Mapa kodu
| plik | rola |
| --- | --- |
| `src/api/tokenStore.ts` | access token w zmiennej modułu: `get/set/clearAccessToken`. **Nigdy** localStorage/sessionStorage (ochrona przed XSS) |
| `src/api/client.ts` | `apiClient`: `baseURL` z `VITE_API_BASE_URL`, `withCredentials: true` (ciasteczko refresh), interceptor Bearer, single-flight refresh, `REFRESH_PATH` |
| `src/api/auth.ts` | `login` (ustawia token z body), `register`, `refreshSession`, `logout`, aktywacja, reset hasła |
| `src/auth/AuthContext.tsx` | `AuthProvider` + `useAuth()` |
| `src/components/ProtectedRoute.tsx` | bramka tras (status + rola) |
| `src/pages/HomeRoute.tsx` | `/`: zalogowany → dashboard, niezalogowany → landing |
| `src/pages/auth/*` | ekrany w `AuthLayout` |

## Przepływy
- **Bootstrap** (raz, `didBootstrap` chroni przed podwójnym efektem StrictMode): `refreshSession()` → `getMe()` → `authenticated`. Błąd: 401 → `unauthenticated`; sieć/5xx → `error` (**nie** wylogowuje na stałe — ważna sesja mogła się chwilowo nie odtworzyć). `ProtectedRoute` pokazuje wtedy „Spróbuj ponownie” → `retry` (= ponowny bootstrap). Workaround #98, który przy błędzie wysyłał na `/login`, został celowo cofnięty (PR #37) — nie przywracaj.
- **Login** jest atomowy: `apiLogin` ustawia token, potem `getMe`. Gdy `getMe` padnie → `clearSession()` i rzucany jest **zwykły** `Error` z `cause`, nie `AxiosError` — strona logowania nie może pomylić awarii profilu z błędem poświadczeń (GH-7).
- **Logout** zawsze udaje się lokalnie: błąd serwera ignorowany, `finally clearSession()`.
- **`clearSession`** to jedyne miejsce sprzątania (token + user + status). Usunięcie konta i nieudany login używają go zamiast własnego czyszczenia.
- **Refresh na 401** (`client.ts`): oryginalne żądanie oznaczane `_retry`; równoległe 401 czekają na **jedną** obietnicę `refreshPromise` (`??=`, zerowana w `finally`). Refresh idzie **czystą** instancją `axios` (bez interceptorów — inaczej pętla). Nieudany refresh → `clearAccessToken()` i odrzucenie z błędem refreshu.
- **Bez refreshu**: wywołanie samego `REFRESH_PATH` i 401 z `errorCode === 'INVALID_PASSWORD'` (złe hasło potwierdzenia przy usuwaniu konta to nie wygasły token; ponowienie wysłałoby destrukcyjne żądanie drugi raz — GH-41).
- **Role**: `hasRole(role)` z `user.roles`; `Role` to unia otwarta (`string & {}`). Etykiety i ukrywanie `ROLE_USER` → `lib/roles.ts`.

## Niezmienniki
- Token nie trafia do żadnego trwałego magazynu ani do logów/URL.
- `ProtectedRoute`: `loading` → `RouteLoader`; `error` → retry; `unauthenticated` → `/login` ze `state.from` (login wraca na `from`); brak roli → `ROUTES.home`.
- Ekran auth po zalogowaniu przekierowuje na dashboard, nie na `/`.
- Komunikaty logowania są enumeration-safe jak backend (nie zdradzają, czy konto istnieje). Logowanie tylko e-mailem — backend nie obsługuje username.

## Otwarte / znane ograniczenia
- **#80 — wiele kart**: każda karta ma własny token w pamięci i własny `refreshPromise`. Dopóki refresh token nie rotuje, równoległe odświeżenia z kilku kart są nieszkodliwe. Po wdrożeniu rotacji (backend#146) druga karta użyje już unieważnionego ciasteczka → wylogowanie. Kierunek: koordynacja między kartami (`BroadcastChannel` / Web Locks), jedna karta odświeża, reszta dostaje token. Testy muszą to symulować (dwa niezależne „klienty”), sam MSW tego nie pokaże.
- Social login (Google/Discord) — brak OAuth w backendzie; nie implementować.

## Testy, które to pinują
- `src/auth/AuthContext.test.tsx` — bootstrap, statusy, login/logout.
- `src/api/users.test.ts`, `src/pages/DeleteAccountDialog.test.tsx` — 401 `INVALID_PASSWORD` nie wyzwala refreshu ani ponowienia.
- `src/App.test.tsx` — brak roli → dashboard, `ProtectedRoute` przed `lazy`.
- **Luka (stan 2026-11-21):** nie ma `client.test.ts` — single-flight (kilka równoległych 401 → jeden refresh) i ścieżka nieudanego refreshu nie mają testu. Przed #80 dopisz go najpierw: to dokładnie mechanizm, który #80 zmienia.

Wzorzec zalogowanego użytkownika: skill `frontend-testing`.
