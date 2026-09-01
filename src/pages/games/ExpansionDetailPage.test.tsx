import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion } from '@/test/fixtures'
import type { GameExpansionDto } from '@/api/types'
import ExpansionDetailPage from './ExpansionDetailPage'

function mockExpansion(expansion: GameExpansionDto) {
  server.use(http.get(`${ANY_ORIGIN}/api/v1/expansions/1`, () => HttpResponse.json(expansion)))
}

function renderDetail(path = '/expansions/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/expansions/:id" element={<ExpansionDetailPage />} />
        <Route path="/expansions" element={<div>DODATKI</div>} />
        <Route path="/games/:id" element={<div>GRA BAZOWA</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Kafelek metryki razem z podpisem o źródle wartości. */
function tile(label: string) {
  return screen.getByText(label).closest('div') as HTMLElement
}

describe('ExpansionDetailPage', () => {
  /**
   * Sedno widoku: fixture nadpisuje maxPlayers (6) i dziedziczy czas oraz wiek —
   * użytkownik musi widzieć, które wartości są własne, a które z gry bazowej.
   */
  it('rozróżnia wartości nadpisane od dziedziczonych', async () => {
    mockExpansion(makeExpansion())
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Agricola: Rzeka')

    expect(within(tile('Gracze')).getByText('1–6')).toBeInTheDocument()
    expect(within(tile('Gracze')).getByText('nadpisane')).toBeInTheDocument()

    expect(within(tile('Czas')).getByText('120 min')).toBeInTheDocument()
    expect(within(tile('Czas')).getByText('z gry bazowej')).toBeInTheDocument()

    expect(within(tile('Wiek')).getByText('z gry bazowej')).toBeInTheDocument()
  })

  it('kategorie własne są oznaczone jako nadpisane', async () => {
    mockExpansion(
      makeExpansion({
        categories: [{ id: 9, name: 'Kooperacyjna' }],
        effectiveCategories: [{ id: 9, name: 'Kooperacyjna' }],
      }),
    )
    renderDetail()

    const categories = (await screen.findByText('Kategorie:')).closest('div') as HTMLElement
    expect(within(categories).getByText('Kooperacyjna')).toBeInTheDocument()
    expect(within(categories).getByText('nadpisane')).toBeInTheDocument()
  })

  it('linkuje do gry bazowej po tytule', async () => {
    mockExpansion(makeExpansion())
    renderDetail()

    expect(await screen.findByRole('link', { name: 'Agricola' })).toHaveAttribute(
      'href',
      '/games/1',
    )
  })

  it('własne odrzucone zgłoszenie pokazuje status i powód', async () => {
    mockExpansion(
      makeExpansion({ moderationStatus: 'REJECTED', rejectionReason: 'Brak opisu zawartości.' }),
    )
    renderDetail()

    expect(await screen.findByText('Odrzucone')).toBeInTheDocument()
    expect(screen.getByText('Brak opisu zawartości.')).toBeInTheDocument()
  })

  it('404 daje ekran „nie znaleziono" bez wzmianki o uprawnieniach', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/expansions/1`, () =>
        HttpResponse.json({ errorCode: 'EXPANSION_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderDetail()

    expect(await screen.findByText('Nie znaleziono dodatku')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/uprawnie/i)
  })
})
