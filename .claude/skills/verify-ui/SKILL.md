---
name: verify-ui
description: Weryfikuje zmianę frontu GameHive na żywym backendzie dev i w przeglądarce — sprawdzenie, czy backend działa (:8080), npm run dev z proxy /api, logowanie kontami seedowymi (john.doe ADMIN, jane.smith USER, hasło password123), curl przez proxy z tokenem, regeneracja typów, oględziny w przeglądarce (dark mode, wypełnione ikony, układ mobilny), pomiar paczki po buildzie (chunk wejściowy, vendor, osobne chunki stron). Użyj, gdy użytkownik prosi "sprawdź na żywo", "odpal front", "zobacz w przeglądarce", "czy to działa z backendem", "ile waży paczka", oraz proaktywnie zaproponuj po zmianie, której testy nie dowodzą: nowy endpoint w src/api, zmiana kontraktu, CSS/tokeny/ikony, zmiana w vite.config.ts lub index.html.
---

# Weryfikacja na żywo

Testy (MSW, `css: false`) nie dowodzą wyglądu, działania fontu ikon ani zgodności z prawdziwym backendem. Ten skill zamyka tę lukę. Zawsze pisz w PR, **co sprawdzono, a czego nie**.

## 1. Backend
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/v3/api-docs   # 200 = działa
```
`000` → backend nie działa. Uruchamia go backendowy skill `verify-dev` (`../gamehive-backend`, docker-compose: Postgres + Redis + Meilisearch). Nie startuj go na własną rękę bez zgody użytkownika — poproś albo zaproponuj.

Kontrakt mógł się zmienić → `npm run gen:api` i `git diff src/api/schema.d.ts` (skill `api-contract`).

## 2. Tokeny i curl
```bash
TOKEN=$(bash .claude/skills/verify-ui/scripts/login.sh user)    # jane.smith@example.com, ROLE_USER
TOKEN=$(bash .claude/skills/verify-ui/scripts/login.sh admin)   # john.doe@example.com, ROLE_ADMIN
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/collection/games/ids
```
Hasło obu kont: `password123`. Na dev **nie ma** konta moderatora — moderację testuj adminem (trasy moderacji wpuszczają `ROLE_MODERATOR` **lub** `ROLE_ADMIN`). Zachowanie „moderator bez admina” (np. brak sekcji Administracja) sprawdzisz tylko testem. Zmiany stanu (dodanie do kolekcji, zgłoszenie) **cofnij** po sprawdzeniu i napisz o tym w podsumowaniu.

## 3. Front
- `npm run dev` w tle (`run_in_background`) → http://localhost:5173. `VITE_API_BASE_URL` w `.env` ma być **pusty**: żądania idą względnie na `/api`, a proxy Vite przekazuje je do `:8080` (bez CORS). Inny backend → `VITE_API_PROXY_TARGET`.
- Build produkcyjny: `npm run build && npm run preview` (:4173) — tu sprawdza się podział na chunki i font.

## 4. Przeglądarka
Załaduj skill przeglądarki dostępny w sesji (`claude-in-chrome`, wbudowana przeglądarka albo `run`). Lista kontrolna według zmiany:
- logowanie kontem `user`/`admin`, ścieżka zmiany od wejścia do efektu;
- **aktywna pozycja nawigacji ma wypełnioną ikonę** (`FILL` — regres niewidoczny w testach);
- żadna ikona nie wyświetla się jako tekst (brak w `icon_names`);
- jasny i ciemny motyw (`ThemeToggle`) — hardkodowane kolory wychodzą w ciemnym;
- szerokość mobilna: szuflada nawigacji, Escape ją zamyka;
- konsola bez błędów i ostrzeżeń React; zakładka sieci: brak zbędnych i zdublowanych żądań.

## 5. Pomiar paczki
```bash
npm run build 2>&1 | grep -E "dist/assets/(index|vendor|validation)-|warn"
```
Stan odniesienia (GH-67, 2026-11-21): chunk wejściowy `index-*.js` ok. 74,5 kB / 24,1 kB gzip, `vendor-*.js` 232,5 kB / 74,5 kB gzip, font ikon 23,3 kB, brak ostrzeżeń. Zmiana, która wyraźnie podnosi chunk wejściowy albo przywraca ostrzeżenie o rozmiarze, wymaga uzasadnienia w PR (zwykle: statyczny import strony zamiast `lazy`). Liczby „przed / po” wpisz do opisu PR.

## Podsumowanie dla użytkownika
Co sprawdzono (z kontem, adresem i obserwacją), co pominięto i dlaczego, jakie dane na dev zostały zmienione i czy je cofnięto.
