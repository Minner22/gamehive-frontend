import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame, makePage } from '@/test/fixtures'
import type { GameDto, GameExpansionDto } from '@/api/types'
import GameDetailPage from './GameDetailPage'

function mockGame(game: GameDto) {
  server.use(http.get(`${ANY_ORIGIN}/api/v1/games/1`, () => HttpResponse.json(game)))
}

function mockExpansions(expansions: GameExpansionDto[]) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/expansions`, () => HttpResponse.json(makePage(expansions))),
  )
}

function renderDetail(path = '/games/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TestProviders>
        <Routes>
          <Route path="/games/:id" element={<GameDetailPage />} />
          <Route path="/games" element={<div>BIBLIOTEKA</div>} />
          <Route path="/expansions" element={<div>DODATKI</div>} />
        </Routes>
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('GameDetailPage', () => {
  it('pokazuje metrykę, wydawców, autorów i taksonomię', async () => {
    mockGame(makeGame())
    mockExpansions([])
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Agricola', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('1–5')).toBeInTheDocument()
    expect(screen.getByText('120 min')).toBeInTheDocument()
    expect(screen.getByText('12+')).toBeInTheDocument()
    expect(screen.getByText('2007')).toBeInTheDocument()
    expect(screen.getByText('Lookout Games')).toBeInTheDocument()
    expect(screen.getByText('Uwe Rosenberg')).toBeInTheDocument()
    expect(screen.getByText('Ekonomiczna')).toBeInTheDocument()
    expect(screen.getByText('Worker placement')).toBeInTheDocument()
  })

  it('listuje dodatki gry z wartościami efektywnymi', async () => {
    mockGame(makeGame())
    mockExpansions([makeExpansion({ id: 5, name: 'Agricola: Rzeka' })])
    renderDetail()

    expect(await screen.findByText('Agricola: Rzeka')).toBeInTheDocument()
    // maxPlayers nadpisany na 6, reszta dziedziczona z gry bazowej
    expect(screen.getByTitle(/Liczba graczy \(po uwzględnieniu/)).toHaveTextContent('1–6')
  })

  it('gra bez dodatków mówi o tym wprost', async () => {
    mockGame(makeGame())
    mockExpansions([])
    renderDetail()

    expect(await screen.findByText(/nie ma jeszcze zatwierdzonych dodatków/)).toBeInTheDocument()
  })

  /** Dodatki to osobne zapytanie — jego błąd nie może zabrać całej strony gry. */
  it('błąd listy dodatków zostawia grę na ekranie', async () => {
    mockGame(makeGame())
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/expansions`, () =>
        HttpResponse.json({ errorCode: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderDetail()

    expect(await screen.findByText('Nie udało się wczytać dodatków.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Agricola', level: 1 })).toBeInTheDocument()
  })

  it('własne odrzucone zgłoszenie pokazuje status i powód odrzucenia', async () => {
    mockGame(
      makeGame({
        moderationStatus: 'REJECTED',
        rejectionReason: 'Duplikat istniejącej pozycji w bibliotece.',
      }),
    )
    mockExpansions([])
    renderDetail()

    expect(await screen.findByText('Odrzucone')).toBeInTheDocument()
    expect(screen.getByText('Duplikat istniejącej pozycji w bibliotece.')).toBeInTheDocument()
  })

  /**
   * Backend zwraca 404 także na cudze zgłoszenie (ochrona przed enumeracją),
   * więc komunikat nie może sugerować, że gra istnieje, a brakuje uprawnień.
   */
  it('404 daje ekran „nie znaleziono" bez wzmianki o uprawnieniach', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games/1`, () =>
        HttpResponse.json({ errorCode: 'GAME_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderDetail()

    expect(await screen.findByText('Nie znaleziono gry')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Wróć do biblioteki/ })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/uprawnie/i)
  })

  it('niepoprawne id w adresie nie wywołuje zapytania', async () => {
    // Brak handlera dla /api/v1/games/** — gdyby poszło zapytanie, MSW zgłosi błąd.
    renderDetail('/games/abc')

    expect(await screen.findByText('Nie znaleziono gry')).toBeInTheDocument()
  })
})
