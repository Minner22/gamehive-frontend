---
name: new-route
description: Lista kontrolna dodania nowej strony / trasy / ekranu we froncie GameHive — React.lazy w App.tsx, ProtectedRoute na zewnątrz lazy, stała w src/routes/paths.ts (wzorzec *Pattern + builder), pozycja w SideNav we właściwej sekcji (Moderacja vs Administracja), ikony w icon_names w index.html, stany ładowania/404/błędu przez useResource i usePaginatedList, filtry w query stringu, ButtonLink zamiast navigate, test strony. Użyj ZAWSZE, gdy plan lub zmiana dodaje stronę w src/pages, nową trasę, link w nawigacji albo nową ikonę, oraz przy pytaniach "jak dodać ekran", "gdzie dopisać trasę".
---

# Nowa strona / trasa

Każdy punkt poniżej to miejsce, które już raz ktoś pominął albo które łatwo przeoczyć. Odhacz te, które dotyczą zmiany.

## 1. Ścieżka — `src/routes/paths.ts`
- Stała w `ROUTES` (jedno źródło prawdy dla `<Route path>` i linków). **Nigdy** goły string w `to=`.
- Trasa z parametrem: para `detailPattern: '/x/:id'` (dla `<Route>`) + `detail: (id) => \`/x/${id}\`` (dla linków) — wzorzec i link nie mogą się rozjechać.
- Moduł gier: edycja moderatora ma **osobną** ścieżkę `/moderation/*/:id/edit`, nie `/games/:id/edit` (ta jest dla własnego zgłoszenia, tryb `owner`).

## 2. Trasa — `src/App.tsx`
- Strona jako `const XPage = lazy(() => import('@/pages/...'))` — strony mają `export default`.
- `<ProtectedRoute>` **owija** leniwy element (jest na zewnątrz `lazy`): najpierw dostęp, potem pobranie kodu. Niezalogowany nie ściąga kodu panelu admina tylko po to, by zobaczyć przekierowanie (pinuje `src/App.test.tsx`).
- Role: `role="ROLE_ADMIN"` albo lista `role={[...MODERATOR]}` (wystarczy którakolwiek). Brak roli → `ROUTES.home` → `HomeRoute` przekierowuje zalogowanego na dashboard.
- Trasa aplikacji idzie pod `<AppShell />`, ekran auth pod `<AuthLayout />`. Oba layouty mają `Suspense` z `RouteLoader` wokół `<Outlet />` — **nie** dokładaj własnego `Suspense` w stronie.
- Wyjątek: `HomeRoute` jest statyczny (to `/`, kod potrzebny od razu). Nie rób z tego wzorca.
- `path="*"` (`NotFoundPage`) musi zostać ostatni.

## 3. Nawigacja — `src/components/layout/SideNav.tsx`
- Zwykła pozycja → `NAV_ITEMS` (`{ to, icon, label, end? }`; `end: true`, gdy ścieżka jest prefiksem innych, np. `/games` (katalog) vs `/games/my`).
- Sekcja **„Moderacja”** widoczna dla `ROLE_MODERATOR || ROLE_ADMIN`, sekcja **„Administracja”** tylko dla `ROLE_ADMIN`. Pozycję kładź według **roli z backendu**, nie prefiksu adresu: `/admin/search` (reindeks) stoi w „Moderacji”, bo backend wpuszcza tam moderatora.
- Funkcja bez backendu → `SOON_ITEMS` (jak Hives), nie martwy link.

## 4. Ikony — `index.html`
- Font Material Symbols jest subsetem (`icon_names=...`, alfabetycznie). Nowa ikona w kodzie **musi** trafić na tę listę, inaczej wyświetli się jej nazwa tekstem.
- `src/test/icons.test.ts` pilnuje tego w obie strony (brakujące i nieużywane). Wykrywa `name=`/`icon=`/`iconLeft=`/`iconRight=` z literałem oraz `icon: '...'` w konfiguracji — ikona składana dynamicznie (zmienna, template) **nie zostanie wykryta**; wtedy dodaj ją ręcznie i dopilnuj, żeby literał gdzieś padł.
- Link deklaruje dwie osie `wght,FILL` — nie upraszczaj do jednej (Google zwraca wtedy font statyczny i `filled` w `Icon` przestaje działać).

## 5. Treść strony
- Pojedynczy zasób → `useResource` (`lib/useResource.ts`): stany `loading / ok / notFound / error`. `notFound` liczy `isDomainNotFound`, więc literówka w ścieżce API pokaże błąd, a nie „nie znaleziono”.
- Komunikat 404 na zasobach enumeration-safe (`/games/{id}`, `/expansions/{id}`) **nie może** mówić o uprawnieniach („nie istnieje lub nie masz dostępu” też nie — po prostu „nie znaleziono”).
- Nowa lista gier/dodatków → **nie** twórz osobnego ekranu: to zakładka albo filtr katalogu (`CatalogPage`, #84). Link z innego ekranu przez `catalogHref({ type, filters })`.
- Zmiana ścieżki istniejącego ekranu → zostaw stary adres jako przekierowanie z zachowaniem query (wzór: `LegacyCatalogRedirect` + `legacyCatalogHref`, test w `App.test.tsx`).
- Lista stronicowana → `usePaginatedList` + `Pagination`, `ListSkeleton` na pierwsze ładowanie, `EmptyState` dla pustej listy.
- Filtry listy trzymaj w query stringu (`lib/catalog.ts` jako wzór: parsowanie odporne na śmieci, serializacja bez wartości domyślnych, round-trip w teście) — adres jest źródłem prawdy; pole szukania przez `useDebouncedValue`.
- Nawigacja z akcji → `ButtonLink` (renderuje `<a>`), nie `Button` + `navigate`. `navigate` tylko po udanym submicie.
- Wywołania API wyłącznie przez `@/api/*` (skill `api-contract`), nie przez `apiClient` w stronie.
- Z kolejki moderacji **nie linkuj** do `/games/{id}` ani `/expansions/{id}` — moderator dostanie 404 na cudze zgłoszenie.
- Wygląd i dostępność → skill `ui-review`.

## 6. Testy
- Test strony obok pliku (`XPage.test.tsx`), renderowany bezpośrednio w `MemoryRouter` + `TestProviders` — nie przez `App`. Wzorce: skill `frontend-testing`.
- Nowa reguła dostępu (rola, przekierowanie) → przypadek w `src/App.test.tsx`.

## 7. Domknięcie
- `npm run build` — sprawdź, że strona wyszła jako osobny chunk i chunk `index-*.js` nie urósł (dziś ok. 74 kB / 24 kB gzip).
- CLAUDE.md / skille → skill `claudemd-sync`.
