import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { makePage } from '@/test/fixtures'
import { ToastProvider } from '@/components/ui'
import { ROUTES } from '@/routes/paths'
import App from './App'

const auth = vi.hoisted(() => ({
  status: 'authenticated' as string,
  user: { id: 'u1', username: 'jan', email: 'jan@example.com', roles: ['ROLE_USER'] },
  retry: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn<(role: string) => boolean>(() => false),
}))
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/collection/CollectionContext', () => ({
  useCollection: () => ({ owns: () => false, add: vi.fn(), remove: vi.fn() }),
  CollectionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>,
  )
}

/**
 * Strony są ładowane leniwie (`React.lazy`), więc pierwszy render trasy zawsze
 * przechodzi przez granicę `Suspense` w layoucie. Te testy pilnują, że granica
 * istnieje i że po doładowaniu pojawia się treść, a nie pusty ekran.
 */
describe('App — trasy ładowane leniwie', () => {
  it('trasa aplikacji dojeżdża do treści przez granicę Suspense', async () => {
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/games`, () => HttpResponse.json(makePage([]))),
      http.get(`${ANY_ORIGIN}/api/v1/taxonomy/categories`, () => HttpResponse.json([])),
      http.get(`${ANY_ORIGIN}/api/v1/taxonomy/mechanics`, () => HttpResponse.json([])),
    )
    renderAt(ROUTES.games.library)

    expect(
      await screen.findByRole('heading', { name: 'Biblioteka gier', level: 1 }),
    ).toBeInTheDocument()
  })

  it('trasa auth ma własną granicę w AuthLayout', async () => {
    auth.status = 'unauthenticated'
    renderAt(ROUTES.login)

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    auth.status = 'authenticated'
  })

  /**
   * Kod ekranu za rolą nie ma się doładowywać, gdy rola nie pozwala tam wejść.
   * Zakotwiczenie jest pozytywne — sam brak nagłówka admina przeszedłby też
   * wtedy, gdyby strona w ogóle się nie zrenderowała.
   */
  it('brak roli przekierowuje na dashboard, zamiast pokazywać panel admina', async () => {
    auth.hasRole.mockReturnValue(false)
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/collection/games`, () => HttpResponse.json(makePage([]))),
      http.get(`${ANY_ORIGIN}/api/v1/collection/expansions`, () => HttpResponse.json(makePage([]))),
      http.get(`${ANY_ORIGIN}/api/v1/games/my`, () => HttpResponse.json(makePage([]))),
      http.get(`${ANY_ORIGIN}/api/v1/expansions/my`, () => HttpResponse.json(makePage([]))),
      http.get(`${ANY_ORIGIN}/api/v1/games`, () => HttpResponse.json(makePage([]))),
    )
    renderAt(ROUTES.admin.users)

    expect(await screen.findByRole('heading', { name: /Cześć, jan/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Użytkownicy' })).not.toBeInTheDocument()
  })

  it('nieznana ścieżka pokazuje stronę 404', async () => {
    renderAt('/nie-ma-takiej-strony')

    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})
