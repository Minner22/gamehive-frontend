import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame, makePage, makeSearchResult } from '@/test/fixtures'
import { ToastProvider } from '@/components/ui'
import type { Page, SearchResultDto } from '@/api/types'
import GameSearchPage from './GameSearchPage'

let searchRequests: URLSearchParams[] = []

function mockTaxonomy() {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () =>
      HttpResponse.json([{ id: 1, name: 'Ekonomiczna' }]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () =>
      HttpResponse.json([{ id: 1, name: 'Worker placement' }]),
    ),
  )
}

function mockSearch(page: Page<SearchResultDto>) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/games/search`, ({ request }) => {
      searchRequests.push(new URL(request.url).searchParams)
      return HttpResponse.json(page)
    }),
  )
}

function renderSearch(entry = '/games/search') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/games/search" element={<GameSearchPage />} />
          <Route path="/games" element={<div>BIBLIOTEKA</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('GameSearchPage', () => {
  beforeEach(() => {
    searchRequests = []
    mockTaxonomy()
  })

  it('wpisana fraza trafia do zapytania (po debounce)', async () => {
    mockSearch(makePage([makeSearchResult()]))
    renderSearch()

    await userEvent.type(await screen.findByLabelText('Fraza'), 'agricola')

    await waitFor(() =>
      expect(searchRequests.some((p) => p.get('q') === 'agricola')).toBe(true),
    )
    // Debounce: jedna litera = jedno zapytanie byłoby ośmioma żądaniami.
    expect(searchRequests.filter((p) => p.get('q')).length).toBeLessThan(4)
  })

  it('wynik typu GAME renderuje kartę gry, EXPANSION — kartę dodatku z grą bazową', async () => {
    mockSearch(
      makePage([
        makeSearchResult({ game: makeGame({ id: 1, title: 'Agricola' }) }),
        makeSearchResult({
          targetType: 'EXPANSION',
          game: undefined,
          expansion: makeExpansion({ id: 2, name: 'Agricola: Rzeka' }),
        }),
      ]),
    )
    renderSearch()

    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(screen.getByText('Agricola: Rzeka')).toBeInTheDocument()
    expect(screen.getByText(/Dodatek do:/)).toBeInTheDocument()
  })

  it('przełącznik zakresu zawęża wyszukiwanie do dodatków', async () => {
    mockSearch(makePage([]))
    renderSearch()

    await userEvent.click(await screen.findByRole('button', { name: 'Dodatki' }))

    await waitFor(() =>
      expect(searchRequests.some((p) => p.get('targetType') === 'EXPANSION')).toBe(true),
    )
  })

  /**
   * Meili bywa niedostępne, a biblioteka czyta z bazy i działa dalej — to
   * degradacja jednej funkcji, nie awaria aplikacji.
   */
  it('503 pokazuje komunikat o niedostępnej wyszukiwarce z wyjściem do biblioteki', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/search`, () =>
        HttpResponse.json({ errorCode: 'SEARCH_INDEX_UNAVAILABLE' }, { status: 503 }),
      ),
    )
    renderSearch()

    expect(await screen.findByText('Wyszukiwarka jest chwilowo niedostępna')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Przejdź do biblioteki/ })).toBeInTheDocument()
  })

  it('po osiągnięciu sufitu trafień mówi o nim wprost', async () => {
    mockSearch(
      makePage([makeSearchResult()], { totalElements: 1000, totalPages: 84, last: false }),
    )
    renderSearch()

    expect(await screen.findByText(/Pokazujemy pierwsze 1000 trafień/)).toBeInTheDocument()
  })

  it('brak trafień to pusty stan, nie błąd', async () => {
    mockSearch(makePage([]))
    renderSearch('/games/search?q=nieistniejace')

    expect(await screen.findByText('Brak trafień')).toBeInTheDocument()
  })
})
