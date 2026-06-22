import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { deleteAccount } from '@/api/users'
import { DeleteAccountDialog } from './DeleteAccountDialog'

const clearSession = vi.hoisted(() => vi.fn())
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ clearSession }) }))
vi.mock('@/api/users', () => ({ deleteAccount: vi.fn() }))

// Minimalny AxiosError z kodem błędu, jakiego oczekuje dialog.
const axiosErr = (status: number, errorCode: string) =>
  Object.assign(new Error('err'), { isAxiosError: true, response: { status, data: { errorCode } } })

function renderDialog() {
  return render(
    <MemoryRouter initialEntries={['/profile/edit']}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<div>STRONA GŁÓWNA</div>} />
          <Route path="/profile/edit" element={<DeleteAccountDialog onClose={vi.fn()} />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/Potwierdź hasłem/), 'haslo123')
  await userEvent.click(screen.getByRole('button', { name: /Usuń konto trwale/ }))
}

describe('DeleteAccountDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sukces → czyści sesję i przenosi na stronę główną', async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce(undefined)
    renderDialog()
    await fillAndSubmit()
    await waitFor(() => expect(clearSession).toHaveBeenCalled())
    expect(screen.getByText('STRONA GŁÓWNA')).toBeInTheDocument()
  })

  it('401 INVALID_PASSWORD → błąd pod polem hasła, sesja nietknięta', async () => {
    vi.mocked(deleteAccount).mockRejectedValueOnce(axiosErr(401, 'INVALID_PASSWORD'))
    renderDialog()
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText('Nieprawidłowe hasło')).toBeInTheDocument())
    expect(clearSession).not.toHaveBeenCalled()
  })

  it('409 CANNOT_REMOVE_LAST_ADMIN → komunikat o ostatnim adminie', async () => {
    vi.mocked(deleteAccount).mockRejectedValueOnce(axiosErr(409, 'CANNOT_REMOVE_LAST_ADMIN'))
    renderDialog()
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText(/Ostatni administrator/)).toBeInTheDocument())
  })
})
