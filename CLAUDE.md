# CLAUDE.md — GameHive Frontend

Wytyczne dla Claude Code w tym repo. Szczegóły obszarów żyją w skillach (`.claude/skills/`,
tabela niżej) — ten plik trzyma tylko to, co dotyczy całego repo. Utrzymanie: skill `claudemd-sync`.

## Czym jest projekt

Frontend platformy **GameHive** — społecznościowej aplikacji dla graczy w **gry planszowe**
(katalog gier i dodatków, kolekcja „The Vault”, moderacja zgłoszeń, profile, panel admina;
społeczności „Hives” czekają na backend). Konsumuje REST API Spring Boot:
[`gamehive-backend`](https://github.com/Minner22/gamehive-backend) (lokalnie `../gamehive-backend`).

## Stack

- **React 19** + **TypeScript**, **Vite 8** (Rolldown) — **wymaga Node ≥ 20.19**, na starszym natywny binding się nie zainstaluje.
- **Tailwind CSS v4** przez `@tailwindcss/vite`; konfiguracja w CSS (`@import 'tailwindcss'` + `@theme`). **Nie ma `tailwind.config.js`** — nie twórz go.
- **React Router v7** (deklaratywnie: `BrowserRouter` + `<Routes>`), **Axios**, `react-hook-form` + `zod`.
- Testy: **Vitest + React Testing Library + MSW** (jsdom).

## Komendy

| komenda | opis |
| --- | --- |
| `npm run dev` | dev server :5173 (proxy `/api` → backend :8080) |
| `npm run build` | `tsc -b` + build produkcyjny |
| `npm run preview` | podgląd builda |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:run` | Vitest watch / jednorazowo |
| `npm run test:coverage` | testy + `coverage/lcov.info` dla Sonara |
| `npm run gen:api` | typy z OpenAPI działającego backendu → `src/api/schema.d.ts` |

Przed commitem: `build`, `lint` i `test:run` zielone, build bez nowych ostrzeżeń.
**CI** (`.github/workflows/ci.yml`, Node 22): `lint` + `test:coverage` + `build` na każdym PR i pushu do `master`,
potem SonarCloud (`Minner22_gamehive-frontend`) — tylko gdy repo ma sekret `SONAR_TOKEN`.
Akcje przypięte do **pełnych SHA** z komentarzem wersji (ruchomy tag da się podmienić).

## Konwencje

- **Commity:** `GH-<nr-issue> <typ>(<scope>): opis po polsku`, **drobne**. Np. `GH-3 feat(forms): walidacja zod zgodna z kontraktem`.
- **Branch + PR:** `GH-<nr>-<opis>`, scalanie przez PR do `master` z **`Closes #N`**. Nie commituj na `master`.
- **Bez stopek AI:** commity i PR-y **bez** `Co-Authored-By: Claude …`, `Claude-Session: …` i „Generated with Claude Code”.
  Decyzja właściciela repo (2026-09-21) — obowiązuje też, gdy narzędzie podpowiada stopkę.
- **Tracking:** GitHub Project #3 „GameHive”; start zadania → issue na **In progress** (kroki: skill `plan-issue`).
  GH-N = numer issue (wyjątek: historyczne GH-2…GH-10). Numery issue **kolidują** z backendem — zawsze `--repo`.
- **gh CLI** do PR-ów; niezalogowany → poproś o `! gh auth login`.

## Architektura

```
src/
  api/               # warstwa HTTP — komponenty NIGDY nie wołają apiClient bezpośrednio
    client.ts        # Axios: baseURL, withCredentials, Bearer + refreshAccessToken (jedyna ścieżka)
    crossTabLock.ts  # blokada Web Locks wspólna dla kart (odświeżanie sesji, #80)
    tokenStore.ts    # access token tylko w pamięci (ochrona XSS)
    schema.d.ts      # generowany (gen:api) — NIE edytować
    schema.contract.ts # strażnik: Page<T> == każdy wygenerowany Page*Dto (tsc -b)
    types.ts         # aliasy DTO + Page<T> + unia Role
    params.ts        # pageParams / setIfPresent (query Spring Data)
    auth.ts users.ts admin.ts games.ts expansions.ts collection.ts taxonomy.ts
    moderation.ts adminTaxonomy.ts adminSearch.ts   # moduł na obszar API
  auth/AuthContext.tsx         # AuthProvider (bootstrap sesji) + useAuth
  collection/CollectionContext.tsx # „mam / nie mam” z /collection/*/ids, raz na sesję
  components/
    ui/              # UI-kit Nectar + barrel '@/components/ui'
    games/ admin/    # komponenty modułu gier i słowników taksonomii
    layout/          # AppShell, SideNav, TopAppBar, AuthLayout, Brand, ThemeToggle…
    ProtectedRoute.tsx
  lib/
    cn.ts            # clsx + tailwind-merge — zamiast sklejania klas
    theme.ts         # store motywu jasny/ciemny
    validation.ts    # schematy zod zgodne z DTO
    apiError.ts      # komunikat, kod błędu, isDomainNotFound, błędy walidacji → pola
    formError.ts     # handleApiFormError (pola + toast)
    useApiForm.ts    # useForm + zod + obsługa błędów API w jednym
    useResource.ts   # pojedynczy zasób: ok / notFound / error
    usePaginatedList.ts # lista stronicowana
    catalog.ts       # katalog „Odkrywaj”: zakładka/fraza/filtry ↔ adres, wybór źródła
                     #   (baza vs wyszukiwarka), przekierowania starych adresów
    useDebouncedValue.ts
    useTaxonomyOptions.ts # słowniki do filtrów, cache modułowy (reset w test/setup.ts)
    expansionValues.ts # dodatek: puste pole = dziedziczenie z gry bazowej
    authorName.ts    # „Imię Nazwisko” ↔ para pól autora
    plural.ts        # pluralPl — polska odmiana
    errorMessages.ts # errorCode → polski komunikat (wszystkie 77 kodów + wzorce dla nowych)
    moderationStatus.ts # dozwolone akcje autora zgłoszenia
    roles.ts         # role do nadania + etykiety
    audit.ts         # parsowanie ROLE_CHANGE w dzienniku audytu
  pages/             # strony (lazy w App.tsx): games/, moderation/, admin/, auth/
  routes/paths.ts    # stałe ścieżek — jedyne źródło prawdy
  test/              # setup MSW, handlery, TestProviders, fixture'y
  index.css          # @theme z tokenami Nectar + utilities hex, glass
  App.tsx            # trasy (AppShell vs AuthLayout)
  main.tsx           # BrowserRouter + AuthProvider + ToastProvider + CollectionProvider
```

## Zasady przekrojowe

Każda ma rozwinięcie w skillu — tu tylko reguła.
- **API tylko przez `@/api/*`**; typy z `@/api/types`, po zmianie backendu `gen:api`. Pułapki kontraktu (`submit`, enumeration-safe 404, sufit w `/games/search`, `/suggest`) → `api-contract`.
- **404**: `isDomainNotFound`, nigdy goły `status === 404` (`RESOURCE_NOT_FOUND` = błąd naszej ścieżki). Komunikat 404 nie mówi o uprawnieniach.
- **Katalog to jeden ekran** (`/games`, „Odkrywaj”, #84): gry, dodatki i wyszukiwanie — nie dodawaj osobnych list. Źródło wybiera `catalogSource` (baza, gdy wystarcza; Meili przy frazie, „Wszystko” lub filtrze spoza bazy); linki przez `catalogHref`. Nazwa „Odkrywaj” jest robocza (zmieni się z Ulami) — w kodzie neutralne „catalog”.
- **Strony leniwe**: nowa trasa jako `lazy(...)` z `ProtectedRoute` **na zewnątrz**; ikona w kodzie → `icon_names` w `index.html` (pilnuje `icons.test.ts`) → `new-route`.
- **Sesja**: token tylko w pamięci, refresh w ciasteczku HttpOnly, bootstrap przez `GET /auth/refresh`. Odświeżanie wyłącznie przez `refreshAccessToken()` — single-flight w karcie + blokada Web Locks między kartami (#80, warunek rotacji refresh tokenów backend#146). Publiczne endpointy auth (`AUTH_PATHS`) bez Bearer i bez refreshu (#88) → `auth-session`.
- **UI**: kolory tylko z tokenów `@theme` (nie `slate-*`/hex), UI-kit zamiast własnych kontrolek, `ButtonLink` do nawigacji, dostępność jak w kicie → `ui-review`.
- **Komunikaty błędów** tylko z `errorCode` przez mapę `errorMessages.ts` — nigdy `ApiError.message` (#81). Nowy kod w backendzie → wpis w mapie → `api-contract`.
- **Formularze**: `useApiForm` / `handleApiFormError` — błędy walidacji na pola (polskie teksty z zod), reszta do toasta.
- **Testy** obok kodu (`*.test.ts(x)`), MSW z `onUnhandledRequest: 'error'`; wykluczenia pokrycia zgodne w `vite.config.ts` i `sonar-project.properties` → `frontend-testing`.
- **Alias `@` → `./src`**; zmienne env z prefiksem `VITE_` (`VITE_API_BASE_URL` pusty w dev = proxy Vite).

## Skille projektu (`.claude/skills/`)

| skill | kiedy |
| --- | --- |
| `plan-issue` | start issue: plan, tablica Project #3, szkic issue do backendu, gdy brakuje API |
| `new-route` | nowa strona/trasa/pozycja nawigacji/ikona |
| `api-contract` | zmiany w `src/api/*`, `gen:api`, obsługa błędów i pułapki kontraktu |
| `auth-session` | `client.ts`, `tokenStore.ts`, `AuthContext`, `ProtectedRoute`, ekrany auth, #80 |
| `frontend-testing` | pisanie i review testów (Vitest + RTL + MSW), izolacja, pokrycie |
| `ui-review` | dostępność + design system Nectar, mockupy Stitch |
| `verify-ui` | weryfikacja na żywym backendzie i w przeglądarce, pomiar paczki |
| `sonar-triage` | SonarCloud: quality gate, issues, plan sprzątania |
| `claudemd-sync` | **po każdym issue**: aktualizacja tego pliku i skilli |

## Design system „Nectar”

Material 3 z miodową paletą (`primary #835400`, `primary-container #f9a825`), Manrope (nagłówki) + Inter (treść),
Material Symbols Outlined, motyw heksagonalny, glassmorphism, brak linii 1px. Tokeny w `src/index.css`;
mockupy Stitch w `stitch_gamehive.zip` (rozpakowane do `stitch_extracted/`, oba ignorowane w git). Szczegóły: `ui-review`.

## Zakres vs backend

- **Gotowe po obu stronach:** auth, profil, panel admina (użytkownicy, audyt, słowniki, reindeks), katalog „Odkrywaj”
  (gry, dodatki i wyszukiwarka na jednym ekranie), zgłoszenia i moderacja, The Vault, dashboard.
- **Zablokowane backendem:** **Hives** — brak endpointów; najpierw issues w `gamehive-backend`.
- **Rozbieżności (nie implementować po stronie frontu):** social login Google/Discord (brak OAuth), login tylko e-mailem,
  awatar i okładka jako URL (`profilePictureUrl` / `coverImageUrl`), nie upload pliku.
- Brakuje czegoś w API → issue do backendu zamiast obejścia na froncie (szablon: `plan-issue`).

## Roadmapa

- **Zrobione:** fundament i auth (GH-1…GH-9), konto i dashboard (GH-10, #20, #21), panel admina (#22–#24),
  jakość — testy, CI, typy z OpenAPI, Sonar (#25–#27, #61), moduł gier (#43–#57, #74), wydajność (#67), skille (#82), jeden katalog „Odkrywaj” (#84), odświeżanie sesji między kartami (#80), komunikaty błędów po polsku z `errorCode` (#81), komunikaty dla unieważnionych linków z maila (#88).
- **Otwarte (Project #3):** **#14** landing.
- **Poza obecnym backendem:** Hives.
