import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox, type ComboboxItem } from './Combobox'

const OPTIONS: ComboboxItem[] = [
  { id: 1, label: 'Lookout Games' },
  { id: 2, label: 'Pending Games', pending: true },
]

function Harness({
  allowCreate,
  fetchOptions = vi.fn(async () => OPTIONS),
}: {
  allowCreate?: boolean
  fetchOptions?: (query: string) => Promise<ComboboxItem[]>
}) {
  const [value, setValue] = useState<ComboboxItem[]>([])
  return (
    <Combobox
      label="Wydawcy"
      value={value}
      onChange={setValue}
      fetchOptions={fetchOptions}
      allowCreate={allowCreate}
    />
  )
}

describe('Combobox', () => {
  it('podpowiada po wpisaniu frazy i wybiera myszą', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole('combobox'), 'look')

    await userEvent.click(await screen.findByRole('option', { name: /Lookout Games/ }))
    expect(screen.getByText('Lookout Games')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usuń: Lookout Games' })).toBeInTheDocument()
  })

  /**
   * Podpowiedzi przychodzą we wszystkich statusach — bez oznaczenia użytkownik
   * utworzyłby duplikat nazwy, która już czeka na zatwierdzenie.
   */
  it('oznacza wpisy oczekujące na zatwierdzenie', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole('combobox'), 'games')

    const pending = await screen.findByRole('option', { name: /Pending Games/ })
    expect(pending).toHaveTextContent('oczekuje na zatwierdzenie')
  })

  it('obsługuje klawiaturę: strzałka i Enter wybierają podpowiedź', async () => {
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'look')
    await screen.findByRole('option', { name: /Lookout Games/ })
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(screen.getByRole('button', { name: 'Usuń: Lookout Games' })).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('pozwala utworzyć nową pozycję z wpisanego tekstu', async () => {
    render(<Harness allowCreate />)

    await userEvent.type(screen.getByRole('combobox'), 'Zupełnie Nowe')
    await userEvent.click(await screen.findByRole('option', { name: /Utwórz/ }))

    expect(screen.getByRole('button', { name: 'Usuń: Zupełnie Nowe' })).toBeInTheDocument()
    expect(screen.getByText('nowy')).toBeInTheDocument()
  })

  it('bez allowCreate nie proponuje tworzenia', async () => {
    render(<Harness fetchOptions={async () => []} />)

    await userEvent.type(screen.getByRole('combobox'), 'Czegoś takiego nie ma')

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('Backspace na pustym polu zdejmuje ostatni wybór', async () => {
    render(<Harness />)
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'look')
    await userEvent.click(await screen.findByRole('option', { name: /Lookout Games/ }))
    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')

    expect(screen.queryByRole('button', { name: 'Usuń: Lookout Games' })).not.toBeInTheDocument()
  })

  /** Padnięcie podpowiedzi nie może zablokować wpisania własnej nazwy. */
  it('błąd źródła podpowiedzi zostawia możliwość utworzenia wpisu', async () => {
    render(<Harness allowCreate fetchOptions={async () => Promise.reject(new Error('offline'))} />)

    await userEvent.type(screen.getByRole('combobox'), 'Nowy Wydawca')

    expect(await screen.findByRole('option', { name: /Utwórz/ })).toBeInTheDocument()
  })
})
