import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeExpansion, makeGame, makePage } from '@/test/fixtures'
import type { GameDto } from '@/api/types'
import MySubmissionsPage from './MySubmissionsPage'

let myGamesCalls = 0

function mockSubmissions(games: GameDto[]) {
  myGamesCalls = 0
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/games/my`, () => {
      myGamesCalls++
      return HttpResponse.json(makePage(games))
    }),
    http.get(`${ANY_ORIGIN}/api/v1/expansions/my`, () =>
      HttpResponse.json(
        makePage([makeExpansion({ id: 3, name: 'Rzeka', moderationStatus: 'DRAFT' })]),
      ),
    ),
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/games/my']}>
      <TestProviders>
        <MySubmissionsPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('MySubmissionsPage', () => {
  beforeEach(() => mockSubmissions([makeGame({ id: 1, title: 'Szkic gry', moderationStatus: 'DRAFT' })]))

  it('pokazuje status zgłoszenia i akcje właściwe dla szkicu', async () => {
    renderPage()

    expect(await screen.findByText('Szkic gry')).toBeInTheDocument()
    expect(screen.getByText('Szkic')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Edytuj/ })).toHaveAttribute('href', '/games/1/edit')
    expect(screen.getByRole('button', { name: /Wyślij do moderacji/ })).toBeInTheDocument()
  })

  /** PENDING jest nieedytowalne — UI nie ma proponować ścieżki, którą backend odrzuci. */
  it('zgłoszenie w moderacji nie ma akcji zmieniających', async () => {
    mockSubmissions([makeGame({ id: 1, title: 'W moderacji', moderationStatus: 'PENDING' })])
    renderPage()

    expect(await screen.findByText('W moderacji')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Edytuj/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wyślij do moderacji/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Czeka na decyzję moderatora/)).toBeInTheDocument()
  })

  it('odrzucone zgłoszenie eksponuje powód', async () => {
    mockSubmissions([
      makeGame({
        id: 1,
        title: 'Odrzucona',
        moderationStatus: 'REJECTED',
        rejectionReason: 'Duplikat pozycji z biblioteki.',
      }),
    ])
    renderPage()

    expect(await screen.findByText('Duplikat pozycji z biblioteki.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wyślij do moderacji/ })).toBeInTheDocument()
  })

  it('wysyłka zmienia status na liście bez ponownego pobrania strony', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/games/1/submit`, () =>
        HttpResponse.json(makeGame({ id: 1, moderationStatus: 'PENDING' })),
      ),
    )
    renderPage()

    await screen.findByText('Szkic gry')
    expect(myGamesCalls).toBe(1)

    await userEvent.click(screen.getByRole('button', { name: /Wyślij do moderacji/ }))

    expect(await screen.findByText('Czeka na moderację')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wyślij do moderacji/ })).not.toBeInTheDocument()
    expect(myGamesCalls).toBe(1)
  })

  /**
   * Po wyczerpaniu limitu backend nie zmienia stanu zgłoszenia — komunikat musi
   * kierować do moderatora, bo tylko on może je odblokować.
   */
  it('wyczerpany limit poprawek kieruje do moderatora i zostawia stan', async () => {
    mockSubmissions([makeGame({ id: 1, title: 'Odrzucona', moderationStatus: 'REJECTED' })])
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/games/1/submit`, () =>
        HttpResponse.json({ errorCode: 'RESUBMISSION_LIMIT_EXCEEDED' }, { status: 409 }),
      ),
    )
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: /Wyślij do moderacji/ }))

    expect(await screen.findByText(/o odblokowanie zgłoszenia poproś moderatora/)).toBeInTheDocument()
    expect(screen.getByText('Odrzucone')).toBeInTheDocument()
  })

  it('przełącznik pokazuje zgłoszenia dodatków', async () => {
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Dodatki' }))

    expect(await screen.findByText('Rzeka')).toBeInTheDocument()
  })

  it('brak zgłoszeń zachęca do dodania gry', async () => {
    mockSubmissions([])
    renderPage()

    expect(await screen.findByText('Nie masz jeszcze żadnych zgłoszeń gier')).toBeInTheDocument()
  })
})
