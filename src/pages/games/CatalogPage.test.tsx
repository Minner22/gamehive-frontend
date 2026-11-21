import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame, makePage, makeSearchResult } from '@/test/fixtures'
import type { GameDto, GameExpansionDto, Page, SearchResultDto } from '@/api/types'
import CatalogPage from './CatalogPage'

/**
 * Zapytania per źródło. Asercje stoją na tym, **który** endpoint został zapytany —
 * to jest reguła scalonego ekranu. Źródło bez handlera wywala test
 * (`onUnhandledRequest: 'error'`), więc niechciane zapytanie też zostanie złapane.
 */
let requests: Record<'games' | 'expansions' | 'search', URLSearchParams[]>

function mockTaxonomy() {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () =>
      HttpResponse.json([
        { id: 1, name: 'Ekonomiczna' },
        { id: 2, name: 'Rodzinna' },
      ]),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () =>
      HttpResponse.json([{ id: 1, name: 'Worker placement' }]),
    ),
  )
}

function mockGames(games: GameDto[]) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/games`, ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.games.push(params)
      return HttpResponse.json(
        makePage(games, { number: Number(params.get('page') ?? 0), totalPages: 2, last: false }),
      )
    }),
  )
}

function mockExpansions(expansions: GameExpansionDto[]) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/expansions`, ({ request }) => {
      requests.expansions.push(new URL(request.url).searchParams)
      return HttpResponse.json(makePage(expansions))
    }),
  )
}

function mockSearch(page: Page<SearchResultDto>) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/games/search`, ({ request }) => {
      requests.search.push(new URL(request.url).searchParams)
      return HttpResponse.json(page)
    }),
  )
}

function renderCatalog(entry = '/games') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TestProviders>
        <Routes>
          <Route path="/games" element={<CatalogPage />} />
          <Route path="/games/:id" element={<div>GRA BAZOWA</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

const last = (list: URLSearchParams[]) => list[list.length - 1]

describe('CatalogPage', () => {
  beforeEach(() => {
    requests = { games: [], expansions: [], search: [] }
    mockTaxonomy()
  })

  /** Domyślne wejście nie może zależeć od Meilisearch — czyta pełną bibliotekę z bazy. */
  it('domyślnie pokazuje bibliotekę gier z bazy', async () => {
    mockGames([makeGame({ id: 1, title: 'Agricola' }), makeGame({ id: 2, title: 'Wingspan' })])
    renderCatalog()

    expect(await screen.findByRole('heading', { name: 'Odkrywaj', level: 1 })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wingspan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gry' })).toHaveAttribute('aria-pressed', 'true')
    expect(requests.search).toHaveLength(0)
  })

  it('filtrowanie wysyła wybrany filtr i wraca na pierwszą stronę', async () => {
    mockGames([makeGame()])
    // Wejście z linku wskazującego drugą stronę — filtr musi ją zresetować.
    renderCatalog('/games?page=1')

    await waitFor(() => expect(requests.games).toHaveLength(1))
    expect(requests.games[0].get('page')).toBe('1')

    await userEvent.click(screen.getByRole('button', { name: 'Filtry' }))
    await userEvent.selectOptions(await screen.findByLabelText('Kategoria'), '2')
    await userEvent.click(screen.getByRole('button', { name: /Filtruj/ }))

    await waitFor(() => expect(requests.games.length).toBeGreaterThan(1))
    expect(last(requests.games).get('categoryId')).toBe('2')
    expect(last(requests.games).get('page')).toBe('0')
  })

  /**
   * Katalog to główne wejście — rozwinięty formularz spychał wyniki o ponad ekran
   * na telefonie. Licznik mówi, że filtry działają, choć panel jest zwinięty.
   */
  it('filtry są domyślnie zwinięte, licznik pokazuje aktywne, a po zatwierdzeniu panel się zwija', async () => {
    mockExpansions([makeExpansion()])
    // baseGameId ma własny baner nad wynikami, więc nie wlicza się do licznika.
    renderCatalog('/games?type=expansion&categoryId=1&baseGameId=7')

    const toggle = await screen.findByRole('button', { name: 'Filtry (1)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByLabelText('Kategoria')).not.toBeVisible()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Kategoria')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: /Filtruj/ }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Filtry/ })).toHaveAttribute('aria-expanded', 'false'),
    )
    expect(screen.getByLabelText('Kategoria')).not.toBeVisible()
  })

  it('wpisana fraza przełącza na wyszukiwarkę zawężoną do zakładki (po debounce)', async () => {
    mockGames([makeGame()])
    mockSearch(makePage([makeSearchResult()]))
    renderCatalog()

    await userEvent.type(await screen.findByLabelText('Szukaj'), 'agricola')

    await waitFor(() => expect(requests.search.some((p) => p.get('q') === 'agricola')).toBe(true))
    expect(last(requests.search).get('targetType')).toBe('GAME')
    // Debounce: jedna litera = jedno zapytanie byłoby ośmioma żądaniami.
    expect(requests.search.length).toBeLessThan(4)
  })

  it('zakładka Dodatki bez frazy czyta dodatki z bazy', async () => {
    mockGames([makeGame()])
    mockExpansions([makeExpansion({ id: 3, name: 'Agricola: Rzeka' })])
    renderCatalog()

    await userEvent.click(await screen.findByRole('button', { name: 'Dodatki' }))

    expect(await screen.findByRole('link', { name: 'Agricola: Rzeka' })).toHaveAttribute(
      'href',
      '/expansions/3',
    )
    expect(screen.getByText(/Dodatek do:/)).toBeInTheDocument()
    expect(requests.search).toHaveLength(0)
  })

  /** Baza dodatków nie filtruje po liczbie graczy (to wartość efektywna) — robi to wyszukiwarka. */
  it('filtr, którego baza dodatków nie obsługuje, idzie przez wyszukiwarkę', async () => {
    mockSearch(makePage([]))
    renderCatalog('/games?type=expansion&players=2')

    await waitFor(() => expect(requests.search).toHaveLength(1))
    expect(requests.search[0].get('players')).toBe('2')
    expect(requests.search[0].get('targetType')).toBe('EXPANSION')
    expect(requests.expansions).toHaveLength(0)
  })

  it('liczba graczy wpisana w zakładce Dodatki przełącza źródło na wyszukiwarkę', async () => {
    mockExpansions([makeExpansion()])
    mockSearch(makePage([]))
    renderCatalog('/games?type=expansion')

    await waitFor(() => expect(requests.expansions).toHaveLength(1))
    await userEvent.click(screen.getByRole('button', { name: 'Filtry' }))
    // Rok wydania nie dotyczy dodatków — pola nie ma w tej zakładce.
    expect(screen.queryByLabelText('Rok wydania')).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Liczba graczy'), '3')
    await userEvent.click(screen.getByRole('button', { name: /Filtruj/ }))

    await waitFor(() => expect(requests.search).toHaveLength(1))
    expect(requests.search[0].get('players')).toBe('3')
  })

  it('kolejna strona trafia do zapytania', async () => {
    mockGames([makeGame()])
    renderCatalog()

    await userEvent.click(await screen.findByRole('button', { name: /Następna/ }))

    await waitFor(() => expect(last(requests.games).get('page')).toBe('1'))
  })

  it('zakładka Wszystko łączy gry i dodatki z wyszukiwarki', async () => {
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
    renderCatalog('/games?type=all')

    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Agricola: Rzeka' })).toBeInTheDocument()
    expect(requests.search[0].get('targetType')).toBeNull()
  })

  /** Wejście z linku „wszystkie dodatki do tej gry” ze strony gry. */
  it('zawężenie do gry bazowej z adresu jest widoczne i odwracalne', async () => {
    mockExpansions([makeExpansion({ baseGameId: 7, baseGameTitle: 'Carcassonne' })])
    renderCatalog('/games?type=expansion&baseGameId=7')

    await waitFor(() => expect(requests.expansions[0]?.get('baseGameId')).toBe('7'))
    expect(await screen.findByText(/Pokazujemy dodatki do gry: Carcassonne/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zobacz grę/ })).toHaveAttribute('href', '/games/7')

    await userEvent.click(screen.getByRole('button', { name: /Pokaż wszystkie dodatki/ }))

    await waitFor(() => expect(last(requests.expansions).get('baseGameId')).toBeNull())
  })

  /** Meili bywa niedostępne, a baza działa dalej — to degradacja jednej funkcji, nie awaria. */
  it('503 wyszukiwarki pokazuje komunikat z wyjściem do przeglądania z bazy', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/search`, () =>
        HttpResponse.json({ errorCode: 'SEARCH_INDEX_UNAVAILABLE' }, { status: 503 }),
      ),
    )
    mockGames([makeGame({ id: 1, title: 'Agricola' })])
    renderCatalog('/games?type=all&q=agri')

    expect(await screen.findByText('Wyszukiwarka jest chwilowo niedostępna')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Przeglądaj bez wyszukiwania/ }))

    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(requests.games).toHaveLength(1)
    expect(screen.getByLabelText('Szukaj')).toHaveValue('')
  })

  it('po osiągnięciu sufitu trafień wyszukiwarki mówi o nim wprost', async () => {
    mockSearch(makePage([makeSearchResult()], { totalElements: 1000, totalPages: 84, last: false }))
    renderCatalog('/games?q=a')

    expect(await screen.findByText(/Pokazujemy pierwsze 1000 trafień/)).toBeInTheDocument()
  })

  it('brak wyników to pusty stan z wyczyszczeniem kryteriów, nie błąd', async () => {
    mockGames([])
    renderCatalog('/games?categoryId=2')

    expect(await screen.findByText('Brak gier dla wybranych kryteriów')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wyczyść kryteria/ })).toBeInTheDocument()
  })

  it('błąd pobrania pokazuje ponowienie zamiast pustej siatki', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games`, () =>
        HttpResponse.json({ errorCode: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderCatalog()

    expect(await screen.findByText('Nie udało się wczytać katalogu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/ })).toBeInTheDocument()
  })
})
