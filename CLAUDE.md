# CLAUDE.md — GameHive Frontend

Wytyczne dla Claude Code w tym repo. Utrzymywane przez Claude — aktualizuj przy
istotnych zmianach (nowy stack, konwencje, struktura, faza roadmapy).

## Czym jest projekt

`gamehive-frontend` to frontend platformy **GameHive** — społecznościowej aplikacji
dla graczy w **gry planszowe** (kolekcje „The Vault", społeczności „Hives", katalog
gier, profile). Konsumuje REST API backendu Spring Boot:
[`gamehive-backend`](https://github.com/Minner22/gamehive-backend).

## Stack

- **React 19** + **TypeScript** (Vite 8) — **wymaga Node ≥ 20.19** (Vite 8/Rolldown;
  na starszym Node natywny binding się nie zainstaluje i build padnie)
- **Tailwind CSS v4** — plugin `@tailwindcss/vite`, konfiguracja przez `@import 'tailwindcss'`
  i dyrektywę `@theme` w CSS. **Nie ma `tailwind.config.js`** — nie twórz go.
- **React Router v7** — `BrowserRouter` + `<Routes>` (deklaratywnie)
- **Axios** — komunikacja z API

## Komendy

| Komenda           | Opis                                  |
| ----------------- | ------------------------------------- |
| `npm run dev`     | dev server (http://localhost:5173)    |
| `npm run build`   | `tsc -b` + build produkcyjny          |
| `npm run preview` | podgląd builda                        |
| `npm run lint`    | ESLint                                |

Przed commitem upewnij się, że `npm run build` i `npm run lint` przechodzą.

## Konwencje (identyczne z backendem)

- **Commity:** `GH-<numer-issue> <typ>(<scope>): opis` po polsku, conventional-commit-style,
  **drobne commity**. Np. `GH-3 feat(forms): walidacja zod zgodna z kontraktem`.
- **Branch + PR:** praca na `GH-<numer>-<opis>`, scalanie przez Pull Request do `master`.
  Nie commituj bezpośrednio na `master`.
- **Stopka commita:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **gh CLI:** używany do PR-ów; jeśli niezalogowany, poproś użytkownika o `! gh auth login`.

## Architektura

```
src/
  api/             # warstwa HTTP
    client.ts      # instancja Axios: baseURL z VITE_API_BASE_URL, withCredentials,
                   #   interceptor Bearer + single-flight refresh na 401
    tokenStore.ts  # access token TYLKO w pamięci (nie localStorage — ochrona XSS)
    types.ts       # typy DTO odwzorowujące kontrakt OpenAPI (ręczne)
    auth.ts        # endpointy /auth/** (login, register, refreshSession, logout, …)
    users.ts       # getMe, updateProfile
  auth/
    AuthContext.tsx# AuthProvider (bootstrap sesji) + useAuth (status/user/login/logout/hasRole)
  components/
    ui/            # UI-kit Nectar (Button/ButtonLink, Input/PasswordInput, Card, Chip,
                   #   Badge, HexAvatar, Icon, Spinner, Toast) + barrel; '@/components/ui'
    layout/        # AppShell, SideNav, TopAppBar, AuthLayout, AuthCard, AuthResult,
                   #   Brand, ThemeToggle
    ProtectedRoute.tsx
  lib/
    cn.ts          # helper klas (clsx + tailwind-merge) — używaj zamiast string concat
    theme.ts       # wspólny store motywu (jasny/ciemny) — jedyne źródło prawdy
    validation.ts  # schematy zod zgodne z kontraktem API (register/login/profile…)
    apiError.ts    # getApiErrorMessage + applyApiValidationErrors (błędy serwera -> pola)
    formError.ts   # handleApiFormError — wspólna obsługa błędu submitu (pola + toast)
  pages/           # widoki przypięte do tras
  routes/paths.ts  # centralne stałe ścieżek (jedno źródło prawdy)
  index.css        # @theme z tokenami Nectar + custom utilities (hex, glass)
  App.tsx          # definicja tras (AppShell vs AuthLayout)
  main.tsx         # punkt wejścia (BrowserRouter + AuthProvider + ToastProvider)
```

- **Sesja/auth:** stan z `useAuth()` (`@/auth/AuthContext`) — `status`/`user`/`login`/
  `logout`/`hasRole`. `AuthProvider` przy starcie odtwarza sesję (`refreshSession` →
  `getMe`). Trasy chroń przez `<ProtectedRoute>` (opcjonalnie `role="ROLE_ADMIN"`).
  Wywołania API rób przez `@/api/auth` i `@/api/users`, nie bezpośrednio przez `apiClient`.

- **Formularze:** `react-hook-form` + `zod` (`zodResolver`). Schematy w
  `src/lib/validation.ts` (zgodne z DTO backendu). Po błędzie zapytania:
  `applyApiValidationErrors(err, setError)` mapuje błędy pól, a `getApiErrorMessage(err)`
  daje komunikat do `useToast().error(...)`. Nawigację linkową rób `ButtonLink`, nie `Button`+navigate.

- **Design tokeny:** w `src/index.css` (`@theme`). Używaj utilities z tokenów
  (`bg-primary`, `text-on-surface`, `bg-surface-container-low`…) — **nie** hardkoduj
  kolorów ani `slate-*`/`violet-*`. Fonty: `font-headline` (Manrope) / `font-body` (Inter).
- **Layouty:** `AppShell` (nawigacja) dla tras aplikacji, `AuthLayout` dla login/register.
- **Alias `@` → `./src`** (vite.config.ts + tsconfig.app.json `paths`). Używaj `@/...`.
- **Sesja:** access token w body logowania, refresh token w ciasteczku **HttpOnly**
  (`/api/v1/auth/refresh`). Po reloadzie sesję odtwarza się przez `GET /auth/refresh`.
- **Zmienne env:** prefiks `VITE_` (`.env`); `VITE_API_BASE_URL` = URL backendu (domyślnie `:8080`).

## Cel wizualny — design system „Nectar"

Mockupy: `stitch_gamehive.zip` (ignorowany w git; rozpakuj do `stitch_extracted/`,
też ignorowane). Każdy ekran: `code.html` (Tailwind przez CDN — wzorzec klas) + `screen.png`.

System **Material 3 / miodowa paleta**, fonty **Manrope** (nagłówki) + **Inter** (body),
ikony **Material Symbols Outlined**, motyw heksagonalny, glassmorphism, brak linii 1px.
Kluczowe tokeny → przenieść do `@theme` (zadanie GH-2):

| token | hex | | token | hex |
| --- | --- | --- | --- | --- |
| primary | `#835400` | | surface | `#f3faff` |
| primary-container | `#f9a825` | | surface-container-low | `#e6f6ff` |
| on-surface | `#071e27` | | surface-container-lowest | `#ffffff` |
| on-surface-variant | `#524434` | | secondary | `#506169` |
| error | `#ba1a1a` | | error-container | `#ffdad6` |

## Zakres vs backend (ważne!)

Mockupy opisują szerszy produkt niż obecne API. Backend dziś = **auth + user + admin**.
- **Buildowalne teraz:** auth flow, profil + edycja, panel admina (users + audit).
- **Zablokowane backendem:** gry/katalog, The Vault/biblioteka, Hives, moderacja, dashboard
  z danymi — wymagają nowych endpointów (osobne issues w `gamehive-backend`).
- **Rozbieżności do oflagowania:** social login Google/Discord (brak OAuth), login
  „email lub username" (backend tylko email), upload awatara (backend ma tylko
  `profilePictureUrl: string`).

## Roadmapa (skrót)

- **Faza 0 ✅** GH-1 init.
- **Faza 1 — fundament:** GH-2 ✅ design system Nectar + AppShell + UI-kit (`/ui`) ·
  GH-3 ✅ formularze (react-hook-form + zod) + Toast + mapowanie błędów API ·
  GH-4 ✅ AuthContext + bootstrap sesji + ProtectedRoute (z rolą) + api/auth+users.
- **Faza 2 — auth:** GH-5 landing (odłożony) · GH-6 ✅ rejestracja · GH-7 ✅ login ·
  GH-8 ✅ aktywacja+resend+logout · GH-9 reset hasła.
- **Faza 3 — konto:** GH-10 profil · GH-11 edycja profilu · GH-12 dashboard (szkielet).
- **Faza 4 — admin:** GH-13 lista userów · GH-14 akcje (role/activate/deactivate/
  force-logout/delete) · GH-15 audyt.
- **Faza 5 — jakość:** GH-16 testy (Vitest+RTL+MSW) · GH-17 CI · GH-18 (opc.) openapi-typescript.
- **Faza 6** — produkt poza obecnym backendem (po stronie API najpierw).