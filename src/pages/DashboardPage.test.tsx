import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makePage } from '@/test/fixtures'
import { ROUTES } from '@/routes/paths'
import DashboardPage from './DashboardPage'

const auth = vi.hoisted(() => ({
  user: { username: 'jan', profile: { firstName: 'Jan' } },
  hasRole: vi.fn<(role: string) => boolean>(() => false),
}))
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => auth }))

/** Licznik bierze się z `totalElements`, więc zawartość strony jest tu bez znaczenia. */
function countingPage(totalElements: number) {
  return HttpResponse.json(makePage([], { totalElements }))
}

function mockCounts({
  collectionGames = 5,
  collectionExpansions = 2,
  myGames = 1,
  myExpansions = 0,
  library = 19,
  queueGames = 3,
  queueExpansions = 4,
} = {}) {
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () => countingPage(collectionGames)),
    http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () =>
      countingPage(collectionExpansions),
    ),
    http.get(`${ANY_ORIGIN}/api/v1/games/my`, () => countingPage(myGames)),
    http.get(`${ANY_ORIGIN}/api/v1/expansions/my`, () => countingPage(myExpansions)),
    http.get(`${ANY_ORIGIN}/api/v1/games`, () => countingPage(library)),
    http.get(`${ANY_ORIGIN}/api/v1/moderation/games`, () => countingPage(queueGames)),
    http.get(`${ANY_ORIGIN}/api/v1/moderation/expansions`, () => countingPage(queueExpansions)),
  )
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

/** Kafelek z podaną etykietą — liczba i etykieta mieszkają w tej samej karcie. */
function tileOf(label: string) {
  return screen.getByText(label).closest('div.rounded-2xl') as HTMLElement
}

describe('DashboardPage', () => {
  beforeEach(() => {
    auth.hasRole.mockReset()
    auth.hasRole.mockReturnValue(false)
    mockCounts()
  })

  it('pokazuje realne liczby z totalElements', async () => {
    renderDashboard()

    expect(await screen.findByText('7')).toBeInTheDocument() // kolekcja: 5 gier + 2 dodatki
    expect(tileOf('Moja kolekcja')).toHaveTextContent('7')
    expect(tileOf('Moje zgłoszenia')).toHaveTextContent('1')
    expect(tileOf('Gry w bibliotece')).toHaveTextContent('19')
  })

  it('kafelka kolejki nie ma bez roli moderatora', async () => {
    renderDashboard()

    await screen.findByText('19')
    expect(screen.queryByText('Kolejka moderacji')).not.toBeInTheDocument()
  })

  it('moderator widzi kolejkę jako sumę obu kolejek', async () => {
    auth.hasRole.mockImplementation((role) => role === 'ROLE_MODERATOR')
    renderDashboard()

    expect(await screen.findByText('Kolejka moderacji')).toBeInTheDocument()
    expect(tileOf('Kolejka moderacji')).toHaveTextContent('7') // 3 gry + 4 dodatki
  })

  /** Jeden padnięty endpoint psuje swój kafelek, a nie cały widok. */
  it('błąd jednego zapytania zostawia pozostałe kafelki nietknięte', async () => {
    mockCounts()
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () => new HttpResponse(null, { status: 500 })),
    )
    renderDashboard()

    expect(await screen.findByText('19')).toBeInTheDocument()
    expect(tileOf('Moja kolekcja')).toHaveTextContent('—')
    expect(tileOf('Moje zgłoszenia')).toHaveTextContent('1')
  })

  it('skróty prowadzą do istniejących tras', async () => {
    renderDashboard()

    const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href')
    expect(href(/Przeglądaj bibliotekę/)).toBe(ROUTES.games.library)
    expect(href(/Szukaj gry/)).toBe(ROUTES.games.search)
    expect(href(/The Vault/)).toBe(ROUTES.vault)
    expect(href(/Zgłoś grę/)).toBe(ROUTES.games.new)
  })
})
