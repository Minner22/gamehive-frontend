import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeGame, makePage } from '@/test/fixtures'
import { ToastProvider } from '@/components/ui'
import type { GameDto } from '@/api/types'
import GamesLibraryPage from './GamesLibraryPage'

/** Kolejne zapytania o listę — na nich stoją asercje o filtrach i stronie. */
let libraryRequests: URLSearchParams[] = []

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

function mockLibrary(games: GameDto[]) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/games`, ({ request }) => {
      const params = new URL(request.url).searchParams
      libraryRequests.push(params)
      return HttpResponse.json(
        makePage(games, { number: Number(params.get('page') ?? 0), totalPages: 2, last: false }),
      )
    }),
  )
}

function renderLibrary(initialEntry = '/games') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <GamesLibraryPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('GamesLibraryPage', () => {
  beforeEach(() => {
    libraryRequests = []
    mockTaxonomy()
  })

  it('renderuje karty gier z metryką', async () => {
    mockLibrary([makeGame({ id: 1, title: 'Agricola' }), makeGame({ id: 2, title: 'Wingspan' })])
    renderLibrary()

    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wingspan' })).toBeInTheDocument()
    expect(screen.getAllByTitle('Liczba graczy')[0]).toHaveTextContent('1–5')
  })

  it('filtrowanie wysyła wybrany filtr i wraca na pierwszą stronę', async () => {
    mockLibrary([makeGame()])
    // Wejście z linku wskazującego drugą stronę — filtr musi ją zresetować.
    renderLibrary('/games?page=1')

    await waitFor(() => expect(libraryRequests).toHaveLength(1))
    expect(libraryRequests[0].get('page')).toBe('1')

    await userEvent.selectOptions(await screen.findByLabelText('Kategoria'), '2')
    await userEvent.click(screen.getByRole('button', { name: /Filtruj/ }))

    await waitFor(() => expect(libraryRequests.length).toBeGreaterThan(1))
    const last = libraryRequests[libraryRequests.length - 1]
    expect(last.get('categoryId')).toBe('2')
    expect(last.get('page')).toBe('0')
  })

  it('pusta strona pokazuje pusty stan z wyjściem do pełnej biblioteki', async () => {
    mockLibrary([])
    renderLibrary('/games?categoryId=2')

    expect(await screen.findByText('Brak gier dla wybranych filtrów')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wyczyść filtry/ })).toBeInTheDocument()
  })

  it('błąd pobrania listy pokazuje ponowienie zamiast pustej siatki', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games`, () =>
        HttpResponse.json({ errorCode: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderLibrary()

    expect(await screen.findByText('Nie udało się wczytać biblioteki')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/ })).toBeInTheDocument()
  })
})
