import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeCollectionItem, makeGame, makePage } from '@/test/fixtures'
import { CollectionButton } from './CollectionButton'

function renderButton() {
  return render(
    <TestProviders>
      <CollectionButton target="game" id={1} name="Agricola" />
    </TestProviders>,
  )
}

describe('CollectionButton', () => {
  it('dodanie przełącza przycisk na „W kolekcji"', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/collection/games/1`, () =>
        HttpResponse.json(makeCollectionItem(), { status: 201 }),
      ),
    )
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Dodaj do kolekcji: Agricola' }))

    expect(
      await screen.findByRole('button', { name: 'Usuń z kolekcji: Agricola' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Dodano do kolekcji.')).toBeInTheDocument()
  })

  /**
   * Duplikat nie jest awarią: backend zwraca 409, ale stan jest dokładnie taki,
   * jakiego użytkownik chciał — komunikat ma być informacją, nie błędem.
   */
  it('409 ALREADY_IN_COLLECTION traktuje jak posiadanie, nie jak błąd', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/collection/games/1`, () =>
        HttpResponse.json({ errorCode: 'ALREADY_IN_COLLECTION' }, { status: 409 }),
      ),
    )
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Dodaj do kolekcji: Agricola' }))

    expect(
      await screen.findByRole('button', { name: 'Usuń z kolekcji: Agricola' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Masz już to w kolekcji.')).toBeInTheDocument()
  })

  /**
   * Dla zalogowanego kontekst czyta kolekcję raz na sesję — dzięki temu przycisk
   * zna stan bez klikania i bez pytania backendu o każdą pozycję z osobna.
   */
  it('po zalogowaniu zna zawartość kolekcji bez klikania', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () =>
        HttpResponse.json({ accessToken: 'token' }),
      ),
      http.get(`${ANY_ORIGIN}/api/v1/users/me`, () =>
        HttpResponse.json({
          id: 'u1',
          username: 'jane',
          email: 'jane@gamehive.io',
          enabled: true,
          roles: ['ROLE_USER'],
          profile: {},
        }),
      ),
      http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () =>
        HttpResponse.json(makePage([makeCollectionItem({ game: makeGame({ id: 1 }) })])),
      ),
      http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () =>
        HttpResponse.json(makePage([])),
      ),
    )
    renderButton()

    expect(
      await screen.findByRole('button', { name: 'Usuń z kolekcji: Agricola' }),
    ).toBeInTheDocument()
  })

  /** Wpisu i tak już nie ma — 404 dociąga stan lokalny do rzeczywistości. */
  it('usunięcie nieistniejącego wpisu kończy się stanem „nie mam"', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/collection/games/1`, () =>
        HttpResponse.json({ errorCode: 'ALREADY_IN_COLLECTION' }, { status: 409 }),
      ),
      http.delete(`${ANY_ORIGIN}/api/v1/collection/games/1`, () =>
        HttpResponse.json({ errorCode: 'COLLECTION_ITEM_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Dodaj do kolekcji: Agricola' }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Usuń z kolekcji: Agricola' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Dodaj do kolekcji: Agricola' }),
    ).toBeInTheDocument()
  })

  it('nieudane dodanie zostawia przycisk w poprzednim stanie', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/collection/games/1`, () =>
        HttpResponse.json({ errorCode: 'GAME_NOT_APPROVED', message: 'Gra nie jest zatwierdzona' }, { status: 409 }),
      ),
    )
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Dodaj do kolekcji: Agricola' }))

    expect(await screen.findByText('Gra nie jest zatwierdzona')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dodaj do kolekcji: Agricola' })).toBeInTheDocument()
  })
})
