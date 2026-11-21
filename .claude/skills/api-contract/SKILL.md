---
name: api-contract
description: Kontrakt frontu GameHive z backendem Spring Boot — warstwa src/api/* (moduły per obszar, nigdy apiClient w komponencie), regeneracja typów npm run gen:api → schema.d.ts, aliasy w types.ts, strażnik Page<T> w schema.contract.ts, budowanie query (pageParams/setIfPresent, powtórzony sort), pole submit w każdym body gier/dodatków, enumeration-safe 404, isDomainNotFound vs RESOURCE_NOT_FOUND, errorCode i getApiErrorCode, mapowanie błędów walidacji na pola, sufit totalElements w /games/search, /suggest zamiast pełnych list. Użyj ZAWSZE przy dodawaniu lub zmianie funkcji w src/api, po zmianie kontraktu w gamehive-backend, przy obsłudze nowego kodu błędu, przy "nie ma takiego endpointu", "jak obsłużyć ten błąd", "skąd typ DTO".
---

# Kontrakt z backendem

Backend: `Minner22/gamehive-backend` (lokalnie `../gamehive-backend`). Jego zasady REST/błędów opisuje backendowy skill `api-conventions` — przy wątpliwości czytaj go, a nie zgaduj.

## Typy
- **Źródło prawdy: `src/api/schema.d.ts`**, generowany `npm run gen:api` z `http://localhost:8080/v3/api-docs` (backend musi działać — patrz skill `verify-ui`). Ręcznie **nie edytuj**.
- Po regeneracji: `git diff src/api/schema.d.ts` — opisz w commicie, co doszło/zmieniło się. Usunięte lub zawężone pole = sprawdź użycia.
- `src/api/types.ts`: aliasy `export type XDto = Schemas['XDto']` + to, czego OpenAPI nie wyraża: generyk `Page<T>` i unia `Role`. Nowy DTO → nowy alias tutaj, komponenty importują z `@/api/types`, nie z `schema`.
- `src/api/schema.contract.ts`: strażnik, że ręczny `Page<T>` jest **dokładnie** kształtem każdego wygenerowanego `Page*Dto` (oba kierunki) — `tsc -b` pada przy rozjeździe. Nowy `Page*Dto` w kontrakcie → dopisz `AssertTrue<Equals<…>>`.
- Odpowiedź będąca gołą tablicą/prymitywem (np. `number[]` z `/collection/*/ids`) nie potrzebuje aliasu.

## Moduł `src/api/<obszar>.ts`
- Jedna funkcja na endpoint, nazwana czynnością (`listCollectionGames`, `submitGame`), zwraca `data`, nie `AxiosResponse`. Docstring tylko gdy kontrakt jest nieoczywisty.
- Komponenty i hooki **nigdy** nie wołają `apiClient` bezpośrednio.
- Query: `pageParams({ page, size, sort })` (Spring Data: `sort` jako **powtórzony** parametr `sort=a,asc&sort=b,desc`) + `setIfPresent(params, key, value)` — pusty string i `undefined` są pomijane, bo `?x=` backend traktuje jako filtrowanie pustą wartością.
- Nowy moduł → wpis w drzewie „Architektura” w CLAUDE.md.

## Pułapki kontraktu (każda już raz ugryzła)
- **Jedna encja, dwa widoki**: biblioteka (`/games`, `/expansions`) to wyłącznie `moderationStatus = APPROVED`; „moje zgłoszenia” (`/games/my`, `/expansions/my`) to własne `DRAFT/PENDING/REJECTED` tej samej encji. Co autor może zrobić ze zgłoszeniem → `lib/moderationStatus.ts` (backend odpowiada `GAME_NOT_EDITABLE`/`EXPANSION_NOT_EDITABLE`, UI nie proponuje tych akcji).
- **Formularze gry i dodatku mają dwa tryby**: `owner` (własne zgłoszenie, zapis przez `games.ts`/`expansions.ts` na `/games/{id}`) i `moderator` (pozycja z biblioteki, zapis przez `moderation.ts` na `/moderation/**`, trasy `/moderation/*/:id/edit`). Nie mieszaj endpointów między trybami.
- **`submit`** jest po stronie backendu prymitywnym `boolean` — `games.ts`, `expansions.ts`, `moderation.ts` dokładają go do **każdego** body, także PUT (brak pola = 400). Nowy endpoint zapisu gry/dodatku → to samo.
- **Dwa różne 404**: kod domenowy (`GAME_NOT_FOUND`, `USER_NOT_FOUND`…) = „nie ma zasobu”; `RESOURCE_NOT_FOUND` = „nie ma takiej ścieżki”, czyli błąd po naszej stronie (gamehive-backend#140, front GH-74). Zawsze `isDomainNotFound(err)` z `lib/apiError.ts`, nigdy goły `status === 404` — inaczej literówka w ścieżce udaje pusty wynik.
- **Enumeration-safe**: `GET /games/{id}` i `/expansions/{id}` dają to samo 404 dla cudzego zgłoszenia i nieistniejącego id. Komunikat nie może sugerować braku uprawnień; moderator nie może tam linkować.
- **401 ≠ wygasły token**: `client.ts` nie odświeża sesji przy `errorCode === 'INVALID_PASSWORD'` (inaczej destrukcyjne żądanie poszłoby dwa razy — GH-41). Nowy 401 oznaczający błąd poświadczeń → dopisz kod do tego warunku (skill `auth-session`).
- **Liczniki** (dashboard): `totalElements` przy `size=1`, ale **nigdy** z `/games/search` — tam sufit 1000 (`maxTotalHits` Meili). Rozmiar biblioteki tylko z `/games`.
- **Katalog: baza czy wyszukiwarka** (`lib/catalog.ts`, `catalogSource`): `/games` i `/expansions` nie mają sufitu ani zależności od Meili, ale nie szukają po frazie, nie łączą gier z dodatkami, a dodatki filtrują tylko po kategorii, mechanice i `baseGameId` (gracze/czas/wiek to wartości efektywne — tylko w wyszukiwarce). `/games/search` ignoruje `sort`, ma sufit 1000 i daje 503 przy niedziałającym Meili. Reguła: baza zawsze, gdy obsługuje wszystkie aktywne filtry. Nowy filtr → dopisz go do `DATABASE_FILTERS`/`APPLICABLE` zgodnie z backendem.
- **Wydawcy/autorzy**: pełne listy są `@Deprecated` i ucięte do 200 — jedyne wejście to `/taxonomy/*/suggest`.
- **Dodatki**: wartości własne (`null` = dziedziczy) i równolegle `effective*` — UI pokazuje różnicę (`lib/expansionValues.ts`).
- **Kolekcja**: stan „mam / nie mam” z `GET /collection/{games,expansions}/ids` (pełna lista id, bez stronicowania); pełne DTO tylko w The Vault.
- **Upload plików nie istnieje**: awatar i okładka to `profilePictureUrl` / `coverImageUrl` jako URL (string).

## Błędy
- Komunikat do toasta: `getApiErrorMessage(err)` (brak odpowiedzi → „Brak połączenia z serwerem.”).
- Własna obsługa przypadku: `getApiErrorCode(err) === 'ALREADY_IN_COLLECTION'` — porównuj **kod**, nigdy treść `message`.
- Formularz: `useApiForm` (`lib/useApiForm.ts`) albo `handleApiFormError` — błędy walidacji (`ApiValidationError.errors[]`) idą na pola, pola spoza formularza i błędy ogólne do toasta (nic nie ginie po cichu). `onError` zwraca `true`, gdy błąd obsłużony specjalnie.
- Komunikaty słowników po sufiksie kodu (`*_IN_USE`, `*_EXISTS`) → `lib/taxonomyErrors.ts`.
- Otwarte: #81 — mapowanie `errorCode` na polskie komunikaty zamiast `ApiError.message` (backend#149). Do czasu wdrożenia nie buduj nowych map komunikatów na boku.

## Brak endpointu po stronie backendu
Nie obchodź go na froncie (pobieranie pełnych list, by wyciągnąć jedno pole; liczenie po stronie klienta). Zmierz koszt i przygotuj issue do backendu — szablon w skillu `plan-issue`. Precedensy: backend#142 (id kolekcji), #143 (kompresja), #146, #149.
