# GameHive — Frontend

Frontend platformy **GameHive**. Konsumuje REST API backendu (Spring Boot,
repo [`gamehive-backend`](https://github.com/Minner22/gamehive-backend)).

## Stack

- **React 19** + **TypeScript** (Vite 8)
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, konfiguracja przez `@theme`)
- **React Router v7** — routing po stronie klienta
- **Axios** — komunikacja z API (JWT Bearer + refresh przez ciasteczko HttpOnly)

## Wymagania

- **Node.js ≥ 20.19** (lub 22 LTS) — Vite 8 opiera się na bundlerze Rolldown,
  który wymaga tej wersji. Na starszym Node natywny binding się nie zainstaluje.
- npm ≥ 10

## Start

```bash
npm install
cp .env.example .env   # ustaw VITE_API_BASE_URL jeśli backend nie jest na :8080
npm run dev            # serwer deweloperski (http://localhost:5173)
```

### Skrypty

| Komenda           | Opis                                  |
| ----------------- | ------------------------------------- |
| `npm run dev`     | serwer deweloperski z HMR             |
| `npm run build`   | typecheck (`tsc`) + build produkcyjny |
| `npm run preview` | podgląd builda produkcyjnego          |
| `npm run lint`    | ESLint                                |

## Konfiguracja środowiska

Zmienne czytane przez Vite muszą mieć prefiks `VITE_` (plik `.env`):

| Zmienna             | Domyślnie               | Opis                  |
| ------------------- | ----------------------- | --------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | bazowy URL backendu   |

## Struktura projektu

```
src/
  api/            # warstwa komunikacji z backendem
    client.ts     # instancja Axios + interceptory (Bearer, refresh na 401)
    tokenStore.ts # access token trzymany w pamięci (nie w localStorage)
    types.ts      # typy DTO odwzorowujące kontrakt OpenAPI
  components/
    layout/       # RootLayout (nawigacja + Outlet)
    ProtectedRoute.tsx
  pages/          # widoki przypięte do tras
  routes/
    paths.ts      # centralne stałe ścieżek
  App.tsx         # definicja tras
  main.tsx        # punkt wejścia (BrowserRouter)
```

## Konwencja commitów

Jak w backendzie: `GH-<numer> <typ>(<scope>): opis`, np.
`GH-1 feat(router): podstawowa struktura tras`. Praca na branchach
`GH-<numer>-<opis>`, scalanie przez Pull Request.
