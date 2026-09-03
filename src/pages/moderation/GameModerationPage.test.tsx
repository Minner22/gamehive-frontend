import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeGame, makePage } from '@/test/fixtures'
import type { GameModerationDto } from '@/api/types'
import GameModerationPage from './GameModerationPage'

let queueCalls = 0

function makeModerationGame(overrides: Partial<GameModerationDto> = {}): GameModerationDto {
  return {
    ...makeGame({ id: 1, title: 'Zgłoszona gra', moderationStatus: 'PENDING' }),
    submittedBy: '019fd827-8af3-73a7-b1b2-b1556ac8f48d',
    reviewedBy: undefined,
    reviewedAt: undefined,
    resubmissionCount: 0,
    ...overrides,
  }
}

let lastQueueStatus: string | null = null

function mockQueue(pending: GameModerationDto[], rejected: GameModerationDto[] = []) {
  queueCalls = 0
  lastQueueStatus = null
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/moderation/games`, ({ request }) => {
      queueCalls++
      lastQueueStatus = new URL(request.url).searchParams.get('status')
      return HttpResponse.json(makePage(lastQueueStatus === 'REJECTED' ? rejected : pending))
    }),
  )
}

function renderQueue() {
  return render(
    <MemoryRouter initialEntries={['/moderation/games']}>
      <TestProviders>
        <GameModerationPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('GameModerationPage', () => {
  beforeEach(() => mockQueue([makeModerationGame()]))


  it('pokazuje dane, na których podejmuje się decyzję', async () => {
    mockQueue([
      makeModerationGame({
        resubmissionCount: 2,
        publishers: [{ id: 5, name: 'Nowa Oficyna', status: 'PENDING' }],
      }),
    ])
    renderQueue()

    expect(await screen.findByText('Zgłoszona gra')).toBeInTheDocument()
    expect(screen.getByText(/poprawki: 2/)).toBeInTheDocument()
    // Nowy wydawca zostanie zatwierdzony razem z grą — moderator musi to widzieć.
    expect(screen.getByText(/Nowa Oficyna • nowy/)).toBeInTheDocument()
  })

  it('zatwierdzenie pokazuje skutek na karcie i zabiera akcje decyzyjne', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/1/approve`, () =>
        HttpResponse.json(makeModerationGame({ moderationStatus: 'APPROVED' })),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Zatwierdź/ }))

    expect(await screen.findByText(/pozycja jest już w bibliotece/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Zatwierdź/ })).not.toBeInTheDocument()
    expect(queueCalls).toBe(1) // bez ponownego pobrania kolejki
  })

  /** Backend odrzuca pusty powód (400) — pytamy o niego, zanim wyślemy żądanie. */
  it('odrzucenie bez powodu nie leci do backendu', async () => {
    let rejectCalls = 0
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/1/reject`, () => {
        rejectCalls++
        return HttpResponse.json(makeModerationGame({ moderationStatus: 'REJECTED' }))
      }),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Odrzuć$/ }))
    await userEvent.click(screen.getByRole('button', { name: /Odrzuć zgłoszenie/ }))

    expect(await screen.findByText(/Podaj powód odrzucenia/)).toBeInTheDocument()
    expect(rejectCalls).toBe(0)
  })

  it('odrzucenie z powodem wysyła go do backendu', async () => {
    let sentReason: string | undefined
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/1/reject`, async ({ request }) => {
        sentReason = ((await request.json()) as { reason: string }).reason
        return HttpResponse.json(makeModerationGame({ moderationStatus: 'REJECTED' }))
      }),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Odrzuć$/ }))
    await userEvent.type(screen.getByLabelText('Powód odrzucenia'), 'Duplikat pozycji')
    await userEvent.click(screen.getByRole('button', { name: /Odrzuć zgłoszenie/ }))

    await waitFor(() => expect(sentReason).toBe('Duplikat pozycji'))
  })

  /**
   * Odrzucone zgłoszenia mają własną kolejkę (backend GH-138) — bez niej moderator
   * nie miałby jak wrócić do odrzuconej pozycji i odblokować jej autorowi.
   */
  it('przełącznik pokazuje kolejkę odrzuconych i pozwala odblokować', async () => {
    mockQueue(
      [makeModerationGame()],
      [makeModerationGame({ id: 2, title: 'Odrzucona gra', moderationStatus: 'REJECTED' })],
    )
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/2/unlock`, () =>
        HttpResponse.json(makeModerationGame({ id: 2, moderationStatus: 'DRAFT' })),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: 'Odrzucone' }))

    expect(await screen.findByText('Odrzucona gra')).toBeInTheDocument()
    expect(lastQueueStatus).toBe('REJECTED')
    // Zgłoszenie odrzucone nie ma już decyzji do podjęcia — tylko odblokowanie.
    expect(screen.queryByRole('button', { name: /^Zatwierdź/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Odblokuj autorowi/ }))

    expect(await screen.findByText(/licznik poprawek wyzerowany/)).toBeInTheDocument()
  })

  it('odrzucenie w kolejce oczekujących odsłania odblokowanie od razu', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/1/reject`, () =>
        HttpResponse.json(makeModerationGame({ moderationStatus: 'REJECTED' })),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Odrzuć$/ }))
    await userEvent.type(screen.getByLabelText('Powód odrzucenia'), 'Za mało danych')
    await userEvent.click(screen.getByRole('button', { name: /Odrzuć zgłoszenie/ }))

    expect(await screen.findByRole('button', { name: /Odblokuj autorowi/ })).toBeInTheDocument()
  })

  /** Dwóch moderatorów naraz: drugi ma dostać zrozumiałą informację, nie surowy kod. */
  it('decyzja podjęta przez kogoś innego mówi o odświeżeniu listy', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/games/1/approve`, () =>
        HttpResponse.json({ errorCode: 'GAME_NOT_PENDING' }, { status: 409 }),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Zatwierdź/ }))

    expect(await screen.findByText(/Ktoś już podjął decyzję/)).toBeInTheDocument()
  })

  it('pusta kolejka mówi wprost, że nie ma nic do zrobienia', async () => {
    mockQueue([])
    renderQueue()

    expect(await screen.findByText('Kolejka jest pusta')).toBeInTheDocument()
  })
})
