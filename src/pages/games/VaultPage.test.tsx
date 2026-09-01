import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeCollectionItem, makeExpansion, makeGame, makePage } from '@/test/fixtures'
import VaultPage from './VaultPage'

let gameListCalls = 0

function mockCollection() {
  gameListCalls = 0
  server.use(
    http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () => {
      gameListCalls++
      return HttpResponse.json(
        makePage([
          makeCollectionItem({ id: 11, game: makeGame({ id: 1, title: 'Agricola' }) }),
          makeCollectionItem({ id: 12, game: makeGame({ id: 2, title: 'Wingspan' }) }),
        ]),
      )
    }),
    http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () =>
      HttpResponse.json(
        makePage([
          {
            id: 21,
            ownershipStatus: 'OWNED' as const,
            addedAt: '2026-08-02T10:00:00Z',
            expansion: makeExpansion({ id: 5, name: 'Agricola: Rzeka' }),
          },
        ]),
      ),
    ),
  )
}

function renderVault() {
  return render(
    <MemoryRouter initialEntries={['/vault']}>
      <TestProviders>
        <VaultPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

describe('VaultPage', () => {
  beforeEach(mockCollection)

  it('pokazuje posiadane gry razem z datą dodania', async () => {
    renderVault()

    expect(await screen.findByRole('link', { name: 'Agricola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wingspan' })).toBeInTheDocument()
    expect(screen.getAllByText(/Dodano/)[0]).toBeInTheDocument()
  })

  it('przełącznik pokazuje dodatki', async () => {
    renderVault()

    await userEvent.click(await screen.findByRole('button', { name: 'Dodatki' }))

    expect(await screen.findByRole('link', { name: 'Agricola: Rzeka' })).toBeInTheDocument()
  })

  /** Wymóg z issue: lista aktualizuje się bez ponownego pobrania strony. */
  it('usunięcie zdejmuje pozycję z listy bez refetchu', async () => {
    server.use(
      http.delete(`${ANY_ORIGIN}/api/v1/collection/games/1`, () => new HttpResponse(null, { status: 204 })),
    )
    renderVault()

    await screen.findByRole('link', { name: 'Agricola' })
    expect(gameListCalls).toBe(1)

    await userEvent.click(screen.getByRole('button', { name: 'Usuń z kolekcji: Agricola' }))

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Agricola' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: 'Wingspan' })).toBeInTheDocument()
    expect(gameListCalls).toBe(1) // brak ponownego pobrania strony
  })

  it('pusta kolekcja zachęca do biblioteki', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () => HttpResponse.json(makePage([]))),
    )
    renderVault()

    expect(await screen.findByText('Twoja kolekcja gier jest pusta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Przeglądaj bibliotekę/ })).toBeInTheDocument()
  })
})
