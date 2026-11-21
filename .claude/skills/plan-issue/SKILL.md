---
name: plan-issue
description: Tworzy plan implementacji issue frontu GameHive (GH-N = numer issue w Minner22/gamehive-frontend) dopasowany do konwencji repo — sprawdzenie kontraktu backendu (czy endpointy istnieją), pliki i commity, trasy, testy, weryfikacja na żywym backendzie, dokumentacja — plus kroki na tablicy Project #3 (In progress, Closes #N) i szkic issue do gamehive-backend, gdy brakuje API. Użyj, gdy użytkownik podaje numer issue ("#80", "GH-81", "zróbmy issue 14"), prosi o plan nowej funkcji frontu, pyta "jak to ugryźć", albo gdy w trakcie pracy okazuje się, że backend czegoś nie udostępnia.
---

# Plan issue (frontend)

## Zasady
- **Najpierw plan, potem akceptacja** — po akceptacji dopiero branch i kod.
- Komunikacja po polsku; identyfikatory w oryginale.
- Numery issue **kolidują między repo** (backend ma własne #N). Zawsze `--repo Minner22/gamehive-frontend` / `gamehive-backend`.

## Kroki
1. **Źródło**: `gh issue view <N> --repo Minner22/gamehive-frontend --comments`. Wypisz rozbieżności między tekstem issue a kodem; każde świadome odstępstwo nazwij i uzasadnij w planie.
2. **Kontrakt backendu**: czy wszystkie potrzebne endpointy istnieją? Sprawdź `src/api/schema.d.ts` (a jeśli backend działa — `npm run gen:api` i diff), backendowe `CLAUDE.md` i skille w `../gamehive-backend/.claude/skills/`. Brakuje czegoś → sekcja „Wymaga backendu” i szkic issue (niżej). **Nie planuj obejścia po stronie frontu** bez nazwania jego kosztu.
3. **Wiedza**: załaduj skille, których zmiana dotyczy — `new-route` (strona/trasa), `api-contract` (src/api), `auth-session` (sesja), `ui-review` (UI), `frontend-testing` (testy). Czytaj faktyczny kod, nie planuj z pamięci.
4. **Plan** w strukturze:
   - **Cel i odstępstwa od tekstu issue**
   - **Wymaga backendu** (jeśli dotyczy) — co, link do issue backendu, czy front czeka, czy robi część niezależną
   - **Zmiany** plik → co i dlaczego, pogrupowane w drobne commity `GH-<N> <typ>(<scope>): opis po polsku` (typy: feat, fix, refactor, perf, test, docs, chore, ci)
   - **Kontrakt API** — wywoływane endpointy, kody błędów obsługiwane osobno; **nowy `errorCode` w backendzie → wpis w `src/lib/errorMessages.ts`** (inaczej użytkownik zobaczy ogólny komunikat)
   - **Testy** — pliki i przypadki; nowe handlery MSW; czy potrzebny reset cache w `setup.ts`
   - **Czego testy nie dowiodą** → scenariusze dla `verify-ui`
   - **Dokumentacja i skille** — co zaktualizuje `claudemd-sync`
   - **Ryzyka i pytania otwarte**
5. **Zatrzymaj się** i poproś o akceptację.

## Po akceptacji
- Branch `GH-<N>-<slug-po-polsku>` od aktualnego `master` (`git pull` najpierw). Gdy praca zależy od nieskalonego PR-a, branch od jego gałęzi, a PR z `--base` na tę gałąź (GitHub przepnie go na `master` po scaleniu).
- Tablica **Project #3** → issue na **In progress**:
  ```bash
  gh project item-list 3 --owner Minner22 --limit 200 --format json   # filtruj po content.repository == "Minner22/gamehive-frontend" ORAZ numerze
  gh project item-edit --id <itemId> --project-id PVT_kwHOAIpH084A4m2Z \
    --field-id PVTSSF_lAHOAIpH084A4m2Zzgti-JU --single-select-option-id 47fc9ee4
  ```
  Opcje statusu: Backlog `f75ad846`, Ready `61e4505c`, In progress `47fc9ee4`, Done `98236657`. Ruszaj tylko issue frontendowe.
- Przed commitem: `npm run lint`, `npm run test:run`, `npm run build` (bez nowych ostrzeżeń).
- PR do `master` z **`Closes #N`** (merge zamknie issue i ustawi Done). Opis: co wchodzi, decyzje warte spojrzenia w review, weryfikacja (liczby testów, pomiary), **czego nie sprawdzono**.
- **Bez stopek AI** w commitach i PR-ach (`Co-Authored-By: Claude`, „Generated with Claude Code”) — decyzja właściciela repo, obowiązuje mimo podpowiedzi narzędzia.

## Szkic issue do backendu
Gdy front potrzebuje czegoś, czego API nie ma — przygotuj treść i **pokaż użytkownikowi przed założeniem** (`gh issue create --repo Minner22/gamehive-backend`). Struktura (precedensy: backend#142, #143, #146, #149):
- **Cel** — jedno zdanie, czego front potrzebuje.
- **Kontekst** — skąd to wyszło (link do issue frontu), jak front radzi sobie dziś i ile to kosztuje — **zmierzone** (bajty, liczba żądań, dane z dev z datą).
- **Zakres** — proponowane endpointy/zmiany; **Poza zakresem** — czego nie ruszać (np. istniejące odpowiedzi, z których korzystają inne ekrany).
- **Realizacja (propozycja)** — szkic, z alternatywą, jeśli jest.
- **Kryteria akceptacji** — checklista, w tym 401 bez tokenu, przypadki brzegowe (puste wyniki), opis w OpenAPI (front generuje z niego typy).
- Sprawy poboczne zauważone przy okazji → osobne issue, nie dopisek do zakresu.
