---
name: frontend-testing
description: Wzorce i pułapki testów frontu GameHive — Vitest + React Testing Library + MSW w jsdom, src/test (setup.ts, server.ts, handlers.ts z ANY_ORIGIN, TestProviders, fixtures make*/captureQuery), onUnhandledRequest error, wzorzec zalogowanego użytkownika (refresh + users/me), izolacja (token w pamięci, cache modułowe resetowane w setup.ts), kiedy vi.mock kontekstu a kiedy MSW, zapytania po roli i nazwie dostępnej, pokrycie i wykluczenia zsynchronizowane z Sonarem. Użyj przy pisaniu lub review testów, gdy test jest niestabilny albo zależy od kolejności, gdy MSW zgłasza nieobsłużone żądanie, przy "jak przetestować X", przy planowaniu sekcji Testy oraz przy zmianie wykluczeń pokrycia.
---

# Testy frontu

Komendy: `npm test` (watch), `npm run test:run` (CI), `npm run test:coverage` (lcov dla Sonara). Pliki `*.test.ts(x)` leżą **obok** kodu.

## Infrastruktura — `src/test/`
- `setup.ts`: `server.listen({ onUnhandledRequest: 'error' })` — każde żądanie bez handlera wywala test. To celowe: wymusza świadome mockowanie i łapie żądania, których nie miało być (np. powrót do starego endpointu). `afterEach`: `cleanup`, `resetHandlers`, `clearAccessToken`, `resetTaxonomyCache`.
- `handlers.ts`: `ANY_ORIGIN = '*'` — w testach `VITE_API_BASE_URL` jest pusty, więc handlery są origin-agnostic: `http.get(\`${ANY_ORIGIN}/api/v1/...\`)`. Domyślny handler: `GET /auth/refresh` → 401 (brak sesji).
- `TestProviders`: `AuthProvider` → `ToastProvider` → `CollectionProvider`, ta sama kolejność co `main.tsx`. Router dokładasz sam (`MemoryRouter` + `Routes`/`Route`, gdy strona czyta `useParams`).
- `fixtures.ts`: `makePage`, `makeGame`, `makeExpansion`, `makeCollectionItem`, `makeSearchResult` (przyjmują `overrides`) oraz `captureQuery(path, body)` — handler zapisujący query string, do asercji na parametrach. Nowy DTO używany w wielu testach → nowa fabryka tutaj, nie literał w każdym pliku.

## Wzorce
- **Zalogowany użytkownik**: nadpisz `GET /auth/refresh` (`{ accessToken: 'token' }`) i `GET /users/me` (`{ id, username, email, enabled, roles, profile: {} }`). Wtedy `CollectionProvider` pobiera `GET /collection/{games,expansions}/ids` — dodaj handlery zwracające `[]`, inaczej `onUnhandledRequest` wywali test.
- **Mock kontekstu przez `vi.mock`** tylko tam, gdzie test dotyczy routingu, nie danych (`App.test.tsx`: `vi.hoisted` obiekt `auth` + mock `CollectionContext`). Strony testuj z prawdziwymi providerami i MSW.
- **Strony renderuj bezpośrednio**, nie przez `App` — leniwe ładowanie ich nie dotyczy. `App.test.tsx` istnieje po to, by granica `Suspense` i reguły dostępu miały pokrycie.
- **Zapytania**: `getByRole(..., { name })` / `findByRole` przed `getByText`; etykiety przycisków-ikon są dostępną nazwą (`'Usuń z kolekcji: Agricola'`). To jednocześnie test dostępności.
- **Asynchroniczność**: `await screen.findBy…` zamiast `waitFor(() => getBy…)`; `userEvent` (nie `fireEvent`).
- **Asercja negatywna potrzebuje kotwicy**: „brak nagłówka admina” przejdzie też, gdy strona w ogóle się nie wyrenderuje — najpierw poczekaj na coś, co **ma** być (wzór w `App.test.tsx`).
- **Komentarz nad testem** (`/** … */`) wyjaśnia *dlaczego* przypadek istnieje, gdy nie wynika z nazwy (konwencja repo). Nazwy testów po polsku, opisują zachowanie.
- Błąd serwera: `HttpResponse.json({ errorCode, message }, { status })` — testuj po kodzie, który UI faktycznie rozróżnia.

## Izolacja — pułapki
- **Cache na poziomie modułu przecieka między testami** (ten sam proces). Każdy nowy cache modułowy (jak `useTaxonomyOptions`) wymaga eksportowanej funkcji `reset…` wołanej w `setup.ts`. Bez tego wynik zależy od kolejności plików.
- Token w pamięci (`tokenStore`) czyści `setup.ts` — nie rób tego w testach ręcznie.
- `server.use(...)` w teście nadpisuje tylko do końca tego testu (`resetHandlers`). Handlery wspólne dla pliku → funkcja pomocnicza wołana w każdym teście albo `beforeEach`.
- `src/test/icons.test.ts` czyta pliki z dysku (`node:fs`), dlatego jest w `tsconfig.node.json`, a `tsconfig.app.json` go wyklucza — nowy test korzystający z Node idzie tak samo.

## Pokrycie
- Wykluczenia trzymaj **zgodne w dwóch miejscach**: `test.coverage.exclude` w `vite.config.ts` i `sonar.coverage.exclusions` w `sonar-project.properties`. Wyklucza się tylko kod bez logiki (generowany, czysto typowy, punkt wejścia, pomoce testowe).
- Quality gate Sonara liczy pokrycie **nowego kodu** — komponent bez własnego pliku testu jest OK, jeśli pokrywa go test strony.

## Czego suita nie dowodzi
- Wyglądu (CSS jest wyłączony: `css: false`), działania fontu ikon i wypełnień `FILL`, prawdziwego kontraktu z backendem (MSW zwraca to, co mu każesz). Do tego skill `verify-ui`.
