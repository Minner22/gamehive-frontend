import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makePage } from '@/test/fixtures'
import { ToastProvider } from '@/components/ui'
import type { GameExpansionDto } from '@/api/types'
import ExpansionsLibraryPage from './ExpansionsLibraryPage'

let requests: URLSearchParams[] = []

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

function mockExpansions(expansions: GameExpansionDto[]) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/expansions`, ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      return HttpResponse.json(makePage(expansions, { number: Number(params.get('page') ?? 0) }))
    }),
  )
}

function renderLibrary(entry = '/expansions') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/expansions" element={<ExpansionsLibraryPage />} />
          <Route path="/games/:id" element={<div>GRA BAZOWA</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ExpansionsLibraryPage', () => {
  beforeEach(() => {
    requests = []
    mockTaxonomy()
  })

  it('renderuje kafelki dodatków z grą bazową', async () => {
    mockExpansions([makeExpansion({ id: 1, name: 'Agricola: Rzeka' })])
    renderLibrary()

    expect(await screen.findByRole('link', { name: 'Agricola: Rzeka' })).toHaveAttribute(
      'href',
      '/expansions/1',
    )
    expect(screen.getByText(/Dodatek do:/)).toBeInTheDocument()
  })

  it('filtr kategorii trafia do zapytania i wraca na pierwszą stronę', async () => {
    mockExpansions([makeExpansion()])
    renderLibrary('/expansions?page=1')

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].get('page')).toBe('1')

    await userEvent.selectOptions(await screen.findByLabelText('Kategoria'), '2')
    await userEvent.click(screen.getByRole('button', { name: /Filtruj/ }))

    await waitFor(() => expect(requests.length).toBeGreaterThan(1))
    const last = requests[requests.length - 1]
    expect(last.get('categoryId')).toBe('2')
    expect(last.get('page')).toBe('0')
  })

  /** Wejście z linku „wszystkie dodatki do tej gry" ze strony gry. */
  it('zawężenie do gry bazowej z adresu jest widoczne i odwracalne', async () => {
    mockExpansions([makeExpansion({ baseGameId: 7, baseGameTitle: 'Carcassonne' })])
    renderLibrary('/expansions?baseGameId=7')

    await waitFor(() => expect(requests[0]?.get('baseGameId')).toBe('7'))
    expect(await screen.findByText(/Pokazujemy dodatki do gry: Carcassonne/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zobacz grę/ })).toHaveAttribute('href', '/games/7')
    expect(screen.getByRole('button', { name: /Pokaż wszystkie/ })).toBeInTheDocument()
  })

  it('pusta lista pokazuje pusty stan z wyczyszczeniem filtrów', async () => {
    mockExpansions([])
    renderLibrary('/expansions?categoryId=2')

    expect(await screen.findByText('Brak dodatków dla wybranych filtrów')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wyczyść filtry/ })).toBeInTheDocument()
  })
})
