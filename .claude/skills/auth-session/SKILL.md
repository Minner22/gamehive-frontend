---
name: auth-session
description: Ekspert sesji i uwierzytelniania frontu GameHive — access token tylko w pamięci (src/api/tokenStore.ts), refresh token w ciasteczku HttpOnly, interceptor Axios w src/api/client.ts (Bearer + refreshAccessToken: single-flight w karcie + blokada Web Locks między kartami w src/api/crossTabLock.ts, limit czasu, wyjątek INVALID_PASSWORD, czysta instancja do refresh), AuthProvider/useAuth (bootstrap refreshSession → getMe, statusy loading/authenticated/unauthenticated/error, retry, clearSession, hasRole), ProtectedRoute i HomeRoute, ekrany auth (login, rejestracja, aktywacja, reset hasła). Użyj ZAWSZE przed zmianą w client.ts, tokenStore.ts, AuthContext.tsx, ProtectedRoute.tsx lub src/pages/auth, przy zmianach odświeżania sesji między kartami (#80, rotacja refresh tokenów backend#146), przy "dlaczego wylogowało", "pętla 401", "ekran Spróbuj ponownie" oraz przed /security-review.
---

# Sesja i uwierzytelnianie

Backendowy odpowiednik: skill `auth-expert` w `gamehive-backend` (typy JWT, Redis, blacklist JTI, epoki sesji). Kontrakt `/api/v1/auth/**` czytaj tam.

## Mapa kodu
| plik | rola |
| --- | --- |
| `src/api/tokenStore.ts` | access token w zmiennej modułu: `get/set/clearAccessToken`. **Nigdy** localStorage/sessionStorage (ochrona przed XSS) |
| `src/api/client.ts` | `apiClient`: `baseURL` z `VITE_API_BASE_URL`, `withCredentials: true` (ciasteczko refresh), interceptor Bearer, **`refreshAccessToken()` — jedyna ścieżka odświeżania**, `REFRESH_PATH`, `REFRESH_TIMEOUT_MS` |
| `src/api/crossTabLock.ts` | `withCrossTabLock(name, fn)` — blokada Web Locks wspólna dla kart originu; bez `navigator.locks` wykonuje `fn` od razu (#80) |
| `src/api/auth.ts` | `login` (ustawia token z body), `register`, `refreshSession` (deleguje do `refreshAccessToken`), `logout`, aktywacja, reset hasła |
| `src/auth/AuthContext.tsx` | `AuthProvider` + `useAuth()` |
| `src/components/ProtectedRoute.tsx` | bramka tras (status + rola) |
| `src/pages/HomeRoute.tsx` | `/`: zalogowany → dashboard, niezalogowany → landing |
| `src/pages/auth/*` | ekrany w `AuthLayout` |

## Przepływy
- **Bootstrap** (raz, `didBootstrap` chroni przed podwójnym efektem StrictMode): `refreshSession()` → `getMe()` → `authenticated`. Błąd: 401 → `unauthenticated`; sieć/5xx → `error` (**nie** wylogowuje na stałe — ważna sesja mogła się chwilowo nie odtworzyć). `ProtectedRoute` pokazuje wtedy „Spróbuj ponownie” → `retry` (= ponowny bootstrap). Workaround #98, który przy błędzie wysyłał na `/login`, został celowo cofnięty (PR #37) — nie przywracaj.
- **Login** jest atomowy: `apiLogin` ustawia token, potem `getMe`. Gdy `getMe` padnie → `clearSession()` i rzucany jest **zwykły** `Error` z `cause`, nie `AxiosError` — strona logowania nie może pomylić awarii profilu z błędem poświadczeń (GH-7).
- **Logout** zawsze udaje się lokalnie: błąd serwera ignorowany, `finally clearSession()`.
- **`clearSession`** to jedyne miejsce sprzątania (token + user + status). Usunięcie konta i nieudany login używają go zamiast własnego czyszczenia.
- **Odświeżanie = `refreshAccessToken()`** (`client.ts`) — jedyna ścieżka, używają jej interceptor (401) i start aplikacji (`refreshSession`). Przed #80 były dwie niezależne i mogły wysłać ten sam refresh równolegle — **nie rozdzielaj ich z powrotem**. Warstwy:
  1. **single-flight w karcie**: równoległe wywołania czekają na jedną obietnicę `refreshPromise` (`??=`, zerowana w `finally`);
  2. **blokada między kartami** `withCrossTabLock('gamehive-auth-refresh', …)`: druga karta czeka, aż pierwsza skończy, i wysyła już **nowe** ciasteczko. Po rotacji refresh tokenów (backend#146) ponowne użycie zrotowanego tokena = „kradzież” i wylogowanie ze wszystkich urządzeń, a backend celowo nie ma okna łaski — koordynacja należy do frontu;
  3. **limit czasu** `REFRESH_TIMEOUT_MS` (15 s): zawieszone żądanie trzymałoby blokadę wszystkich kart.

  Refresh idzie **czystą** instancją `axios` (bez interceptorów — inaczej pętla). Nieudany → `clearAccessToken()` i odrzucenie z błędem refreshu (każde 401, także przyszłe `REFRESH_TOKEN_REUSED`, znaczy „sesja zakończona”).
- **Nieaktualne 401 nie odświeżają**: gdy żądanie wyszło ze starym tokenem, a w pamięci jest już inny (ktoś zdążył odświeżyć), interceptor ponawia z obecnym tokenem bez kolejnego odświeżenia — każde zbędne to rotacja i czekanie na blokadę.
- **Web Locks wymaga secure context** (HTTPS albo `localhost`). Bez niego — i w starych przeglądarkach — działa fallback: tylko single-flight w karcie (zachowanie sprzed #80). Świadomie bez `BroadcastChannel` (rozgłaszania tokenu/wylogowania): każda karta odświeża sama, po kolei; kanał to osobne zadanie, gdyby rotacje kolejnych kart zaczęły przeszkadzać.
- **Bez refreshu**: wywołanie samego `REFRESH_PATH` i 401 z `errorCode === 'INVALID_PASSWORD'` (złe hasło potwierdzenia przy usuwaniu konta to nie wygasły token; ponowienie wysłałoby destrukcyjne żądanie drugi raz — GH-41).
- **Role**: `hasRole(role)` z `user.roles`; `Role` to unia otwarta (`string & {}`). Etykiety i ukrywanie `ROLE_USER` → `lib/roles.ts`.

## Niezmienniki
- Token nie trafia do żadnego trwałego magazynu ani do logów/URL.
- `ProtectedRoute`: `loading` → `RouteLoader`; `error` → retry; `unauthenticated` → `/login` ze `state.from` (login wraca na `from`); brak roli → `ROUTES.home`.
- Ekran auth po zalogowaniu przekierowuje na dashboard, nie na `/`.
- Komunikaty logowania są enumeration-safe jak backend (nie zdradzają, czy konto istnieje). Logowanie tylko e-mailem — backend nie obsługuje username.

## Otwarte / znane ograniczenia
- **Po wdrożeniu backend#146** zostaje test ręczny: dwie karty z wygasłym tokenem bez globalnego wylogowania. Do rozważenia wtedy: osobny komunikat na ekranie logowania przy `REFRESH_TOKEN_REUSED` (dziś każde 401 z refreshu to ciche przejście do logowania).
- Social login (Google/Discord) — brak OAuth w backendzie; nie implementować.

## Testy, które to pinują
- `src/auth/AuthContext.test.tsx` — bootstrap, statusy, login/logout.
- `src/api/users.test.ts`, `src/pages/DeleteAccountDialog.test.tsx` — 401 `INVALID_PASSWORD` nie wyzwala refreshu ani ponowienia.
- `src/App.test.tsx` — brak roli → dashboard, `ProtectedRoute` przed `lazy`.
- `src/api/client.test.ts` — single-flight, nieudany refresh, brak pętli, `INVALID_PASSWORD`, start + interceptor = jedno odświeżenie, limit czasu.
- `src/api/crossTabLock.test.ts` — kolejka blokady, błąd zwalnia blokadę, fallback bez `navigator.locks`.
- `src/api/crossTabRefresh.test.ts` — **dwie karty** jako dwie kopie modułów (`vi.resetModules()`: osobny token i single-flight, wspólna blokada); serwer liczy jednoczesne odświeżenia (`maxInFlight === 1`). Test fallbacku pokazuje `2` — dowód, że wynik daje blokada, nie przypadek w czasie. Sztuczne Web Locks: `src/test/fakeLocks.ts` (sprzątaj w `afterEach` — reszta suity ma jechać na fallbacku).
- Sprawdzone w Chrome (2026-11-21, dwie ramki startujące naraz): `navigator.locks.query()` pokazało 1 trzymaną + 1 oczekującą blokadę, `/refresh` bez nakładania (druga 1–2 ms po pierwszej), obie zalogowane.

Wzorzec zalogowanego użytkownika: skill `frontend-testing`.
