import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makePage } from '@/test/fixtures'
import type { GameExpansionModerationDto } from '@/api/types'
import ExpansionModerationPage from './ExpansionModerationPage'

function makeModerationExpansion(
  overrides: Partial<GameExpansionModerationDto> = {},
): GameExpansionModerationDto {
  return {
    ...makeExpansion({
      id: 21,
      name: 'Carcassonne: Rzeka',
      baseGameId: 12,
      baseGameTitle: 'Carcassonne',
      moderationStatus: 'PENDING',
    }),
    submittedBy: '019fd827-8af3-73a7-b1b2-b1556ac8f48d',
    reviewedBy: undefined,
    reviewedAt: undefined,
    resubmissionCount: 0,
    ...overrides,
  }
}

let lastQueueStatus: string | null = null

function mockQueue(
  pending: GameExpansionModerationDto[],
  rejected: GameExpansionModerationDto[] = [],
) {
  lastQueueStatus = null
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/moderation/expansions`, ({ request }) => {
      lastQueueStatus = new URL(request.url).searchParams.get('status')
      return HttpResponse.json(makePage(lastQueueStatus === 'REJECTED' ? rejected : pending))
    }),
  )
}

function renderQueue() {
  return render(
    <MemoryRouter initialEntries={['/moderation/expansions']}>
      <TestProviders>
        <ExpansionModerationPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('ExpansionModerationPage', () => {
  beforeEach(() => mockQueue([makeModerationExpansion()]))

  /**
   * Moderator ocenia, co dodatek zmienia w grze bazowej — fixture nadpisuje
   * maxPlayers (6) i dziedziczy czas oraz wiek.
   */
  it('pokazuje, które wartości dodatek nadpisuje, a które dziedziczy', async () => {
    renderQueue()

    expect(await screen.findByText('Carcassonne: Rzeka')).toBeInTheDocument()
    expect(within(screen.getByTitle('Liczba graczy')).getByText('nadpisane')).toBeInTheDocument()
    expect(within(screen.getByTitle('Czas gry')).getByText('z gry bazowej')).toBeInTheDocument()
    expect(within(screen.getByTitle('Wiek gracza')).getByText('z gry bazowej')).toBeInTheDocument()
  })

  /** Gra bazowa jest zawsze APPROVED, więc — inaczej niż samo zgłoszenie — da się ją otworzyć. */
  it('linkuje do gry bazowej, ale nie do samego zgłoszenia', async () => {
    renderQueue()

    expect(await screen.findByRole('link', { name: 'Carcassonne' })).toHaveAttribute(
      'href',
      '/games/12',
    )
    expect(screen.queryByRole('link', { name: /Podgląd/ })).not.toBeInTheDocument()
  })

  it('zatwierdzenie uderza w endpoint dodatków', async () => {
    let approveCalls = 0
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/expansions/21/approve`, () => {
        approveCalls++
        return HttpResponse.json(makeModerationExpansion({ moderationStatus: 'APPROVED' }))
      }),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Zatwierdź/ }))

    expect(await screen.findByText(/pozycja jest już w bibliotece/)).toBeInTheDocument()
    expect(approveCalls).toBe(1)
  })

  it('kolejka odrzuconych pozwala odblokować dodatek autorowi', async () => {
    mockQueue(
      [makeModerationExpansion()],
      [makeModerationExpansion({ id: 30, name: 'Odrzucony dodatek', moderationStatus: 'REJECTED' })],
    )
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/expansions/30/unlock`, () =>
        HttpResponse.json(makeModerationExpansion({ id: 30, moderationStatus: 'DRAFT' })),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: 'Odrzucone' }))
    expect(await screen.findByText('Odrzucony dodatek')).toBeInTheDocument()
    expect(lastQueueStatus).toBe('REJECTED')

    await userEvent.click(screen.getByRole('button', { name: /Odblokuj autorowi/ }))

    expect(await screen.findByText(/licznik poprawek wyzerowany/)).toBeInTheDocument()
  })

  /** Kody dodatków są osobne od kodów gier — konflikt ma dać ten sam czytelny komunikat. */
  it('EXPANSION_NOT_PENDING mówi o decyzji podjętej przez kogoś innego', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/moderation/expansions/21/approve`, () =>
        HttpResponse.json({ errorCode: 'EXPANSION_NOT_PENDING' }, { status: 409 }),
      ),
    )
    renderQueue()

    await userEvent.click(await screen.findByRole('button', { name: /Zatwierdź/ }))

    expect(await screen.findByText(/Ktoś już podjął decyzję/)).toBeInTheDocument()
  })

  it('pusta kolejka mówi o dodatkach', async () => {
    mockQueue([])
    renderQueue()

    expect(
      await screen.findByText('Żadne zgłoszenie dodatku nie czeka teraz na decyzję.'),
    ).toBeInTheDocument()
  })
})
