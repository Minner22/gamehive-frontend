import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import AdminSearchPage from './AdminSearchPage'

const REINDEX = `${ANY_ORIGIN}/api/v1/admin/search/reindex`
const RESULT = { games: 128, expansions: 37, publishers: 412, authors: 1180 }

function renderPage() {
  return render(
    <TestProviders>
      <AdminSearchPage />
    </TestProviders>,
  )
}

function start() {
  return userEvent.click(screen.getByRole('button', { name: /Przebuduj indeksy/ }))
}

function confirm() {
  return userEvent.click(screen.getByRole('button', { name: /Tak, przebuduj/ }))
}

function reindexFails(status: number, errorCode: string, message: string) {
  server.use(http.post(REINDEX, () => HttpResponse.json({ errorCode, message }, { status })))
}

describe('AdminSearchPage', () => {
  /** Indeks jest w trakcie przebudowy chwilowo pusty — nikt nie ma prawa kliknąć tego przez pomyłkę. */
  it('nie uruchamia przebudowy bez potwierdzenia', async () => {
    let calls = 0
    server.use(
      http.post(REINDEX, () => {
        calls++
        return HttpResponse.json(RESULT)
      }),
    )
    renderPage()

    await start()

    expect(await screen.findByText(/wyszukiwarka może nie zwracać wyników/)).toBeInTheDocument()
    expect(calls).toBe(0)

    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }))
    expect(calls).toBe(0)
  })

  it('po potwierdzeniu pokazuje wszystkie cztery liczniki', async () => {
    server.use(http.post(REINDEX, () => HttpResponse.json(RESULT)))
    renderPage()

    await start()
    await confirm()

    expect(await screen.findByText('Wynik ostatniej przebudowy')).toBeInTheDocument()
    for (const [label, count] of [
      ['Gry', '128'],
      ['Dodatki', '37'],
      ['Wydawcy', '412'],
      ['Autorzy', '1180'],
    ]) {
      // Licznik ma sens tylko przy swojej etykiecie, więc asercja idzie po komórce.
      expect(screen.getByText(label).closest('div')).toHaveTextContent(count)
    }
    expect(screen.getByText(/Razem 1757 dokumentów/)).toBeInTheDocument()
  })

  it('blokuje przycisk na czas trwania operacji', async () => {
    let release: (() => void) | undefined
    server.use(
      http.post(REINDEX, async () => {
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return HttpResponse.json(RESULT)
      }),
    )
    renderPage()

    await start()
    await confirm()

    const button = screen.getByRole('button', { name: /Przebuduj indeksy/ })
    await waitFor(() => expect(button).toBeDisabled())

    release?.()
    await waitFor(() => expect(button).toBeEnabled())
  })

  /** Równoległe uruchomienie: backend odpowiada 409, a nie „coś poszło nie tak". */
  it('409 mówi, że przebudowa już trwa', async () => {
    reindexFails(409, 'REINDEX_ALREADY_RUNNING', 'Reindex already running')
    renderPage()

    await start()
    await confirm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Przebudowa już trwa')
    expect(screen.queryByText('Wynik ostatniej przebudowy')).not.toBeInTheDocument()
  })

  it('503 mówi o niedostępnym silniku wyszukiwania', async () => {
    reindexFails(503, 'SEARCH_INDEX_UNAVAILABLE', 'Search index unavailable')
    renderPage()

    await start()
    await confirm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Silnik wyszukiwania jest niedostępny',
    )
  })
})
