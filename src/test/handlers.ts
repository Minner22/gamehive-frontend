import { http, HttpResponse } from 'msw'

// W testach baseURL klienta jest pusty (VITE_API_BASE_URL=''), więc żądania są
// względne (origin jsdom). `*` dopasowuje dowolny origin — niezależnie od tego.
export const ANY_ORIGIN = '*'

/** Domyślny stan: brak sesji. Testy nadpisują przez server.use(...). */
export const handlers = [
  http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
]
