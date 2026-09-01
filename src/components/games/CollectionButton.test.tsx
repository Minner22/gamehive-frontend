import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makeCollectionItem } from '@/test/fixtures'
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
