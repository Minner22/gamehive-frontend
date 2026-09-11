import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { TestProviders } from '@/test/TestProviders'
import { ANY_ORIGIN } from '@/test/handlers'
import { makePage } from '@/test/fixtures'
import AdminTaxonomyPage from './AdminTaxonomyPage'

const BASE = `${ANY_ORIGIN}/api/v1/admin/taxonomy`

let publisherQueries: URLSearchParams[] = []

function mockPublishers() {
  publisherQueries = []
  server.use(
    http.get(`${BASE}/publishers`, ({ request }) => {
      const params = new URL(request.url).searchParams
      publisherQueries.push(params)
      return HttpResponse.json(
        makePage([{ id: 19, name: 'Feuerland Spiele', status: 'PENDING' }]),
      )
    }),
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/taxonomy']}>
      <TestProviders>
        <AdminTaxonomyPage />
      </TestProviders>
    </MemoryRouter>,
  )
}

/**
 * Wiersz słownika z podaną nazwą — w nim szukamy przycisków akcji. W słowniku
 * kuratorowanym wierszem jest `<li>`, w rosnącym `div`; bez `li` w selektorze
 * `closest` wspiąłby się do karty sekcji, która zawiera wszystkie wiersze.
 */
function rowOf(name: string) {
  return screen.getByText(name).closest('li, div.rounded-2xl') as HTMLElement
}

describe('AdminTaxonomyPage — wydawcy (słownik rosnący)', () => {
  beforeEach(mockPublishers)

  /** Wpisy PENDING powstają ze zgłoszeń użytkowników i to one są pracą administratora. */
  it('domyślnie pokazuje oczekujących i pozwala ich zatwierdzić', async () => {
    server.use(
      http.post(`${BASE}/publishers/19/approve`, () =>
        HttpResponse.json({ id: 19, name: 'Feuerland Spiele', status: 'APPROVED' }),
      ),
    )
    renderPage()

    expect(await screen.findByText('Feuerland Spiele')).toBeInTheDocument()
    expect(publisherQueries[0].get('status')).toBe('PENDING')
    expect(within(rowOf('Feuerland Spiele')).getByText('oczekuje')).toBeInTheDocument()

    await userEvent.click(within(rowOf('Feuerland Spiele')).getByRole('button', { name: /Zatwierdź/ }))

    await waitFor(() =>
      expect(within(rowOf('Feuerland Spiele')).queryByText('oczekuje')).not.toBeInTheDocument(),
    )
  })

  it('filtr „Wszystkie" wysyła zapytanie bez statusu', async () => {
    renderPage()
    await screen.findByText('Feuerland Spiele')

    await userEvent.click(screen.getByRole('button', { name: 'Wszystkie' }))

    await waitFor(() =>
      expect(publisherQueries.some((params) => !params.has('status'))).toBe(true),
    )
  })

  it('wyszukiwanie trafia do zapytania jako q', async () => {
    renderPage()
    await screen.findByText('Feuerland Spiele')

    await userEvent.type(screen.getByLabelText('Szukaj'), 'feuer')

    await waitFor(() => expect(publisherQueries.some((p) => p.get('q') === 'feuer')).toBe(true))
  })

  /** Sprawdzone na żywo: DELETE wydawcy przypiętego do gry → 409 PUBLISHER_IN_USE. */
  it('usunięcie wpisu w użyciu mówi, że trzeba go najpierw odpiąć', async () => {
    server.use(
      http.delete(`${BASE}/publishers/19`, () =>
        HttpResponse.json({ errorCode: 'PUBLISHER_IN_USE', message: 'Publisher is in use' }, { status: 409 }),
      ),
    )
    renderPage()
    await screen.findByText('Feuerland Spiele')

    await userEvent.click(within(rowOf('Feuerland Spiele')).getByRole('button', { name: 'Usuń' }))
    await userEvent.click(screen.getByRole('button', { name: /Tak, usuń/ }))

    expect(await screen.findByText(/najpierw odepnij ją od treści/)).toBeInTheDocument()
    expect(screen.getByText('Feuerland Spiele')).toBeInTheDocument()
  })

  it('dodaje wydawcę, a pustej nazwy nie wysyła', async () => {
    let created: unknown = null
    server.use(
      http.post(`${BASE}/publishers`, async ({ request }) => {
        created = await request.json()
        return HttpResponse.json({ id: 50, name: 'Rebel', status: 'APPROVED' }, { status: 201 })
      }),
    )
    renderPage()
    await screen.findByText('Feuerland Spiele')

    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }))
    expect(await screen.findByText(/Uzupełnij pole „Nazwa"/)).toBeInTheDocument()
    expect(created).toBeNull()

    await userEvent.type(screen.getByLabelText('Nazwa'), 'Rebel')
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(created).toEqual({ name: 'Rebel' }))
  })
})

describe('AdminTaxonomyPage — autorzy', () => {
  beforeEach(mockPublishers)

  it('edycja autora wysyła imię i nazwisko', async () => {
    let updated: unknown = null
    server.use(
      http.get(`${BASE}/authors`, () =>
        HttpResponse.json(
          makePage([{ id: 21, firstName: 'Vlaada', lastName: 'Chvatil', status: 'PENDING' }]),
        ),
      ),
      http.put(`${BASE}/authors/21`, async ({ request }) => {
        updated = await request.json()
        return HttpResponse.json({ id: 21, firstName: 'Vlaada', lastName: 'Chvátil', status: 'PENDING' })
      }),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Autorzy' }))
    await screen.findByText('Vlaada Chvatil')
    await userEvent.click(within(rowOf('Vlaada Chvatil')).getByRole('button', { name: /Edytuj/ }))

    const lastName = screen.getAllByLabelText('Nazwisko').at(-1) as HTMLElement
    await userEvent.clear(lastName)
    await userEvent.type(lastName, 'Chvátil')
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(updated).toEqual({ firstName: 'Vlaada', lastName: 'Chvátil' }))
    expect(await screen.findByText('Vlaada Chvátil')).toBeInTheDocument()
  })
})

describe('AdminTaxonomyPage — kategorie (słownik kuratorowany)', () => {
  beforeEach(() => {
    mockPublishers()
    server.use(
      http.get(`${BASE}/categories`, () =>
        HttpResponse.json([
          { id: 1, name: 'Strategy' },
          { id: 3, name: 'Party' },
        ]),
      ),
    )
  })

  it('zmiana nazwy wysyła PUT z nową nazwą', async () => {
    let renamed: unknown = null
    server.use(
      http.put(`${BASE}/categories/3`, async ({ request }) => {
        renamed = await request.json()
        return HttpResponse.json({ id: 3, name: 'Imprezowa' })
      }),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Kategorie' }))
    await screen.findByText('Party')
    await userEvent.click(within(rowOf('Party')).getByRole('button', { name: /Zmień nazwę/ }))

    const nameInputs = screen.getAllByLabelText('Nazwa')
    const editInput = nameInputs.at(-1) as HTMLElement
    await userEvent.clear(editInput)
    await userEvent.type(editInput, 'Imprezowa')
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(renamed).toEqual({ name: 'Imprezowa' }))
  })

  /** Sprawdzone na żywo: POST istniejącej nazwy → 409 CATEGORY_NAME_EXISTS. */
  it('istniejąca nazwa daje czytelny komunikat', async () => {
    server.use(
      http.post(`${BASE}/categories`, () =>
        HttpResponse.json(
          { errorCode: 'CATEGORY_NAME_EXISTS', message: 'Category name already exists' },
          { status: 409 },
        ),
      ),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Kategorie' }))
    await screen.findByText('Strategy')
    await userEvent.type(screen.getByLabelText('Nazwa'), 'Strategy')
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findByText('Taka pozycja już jest w słowniku.')).toBeInTheDocument()
  })
})
