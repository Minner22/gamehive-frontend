import { type FormEvent, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  listUsers,
} from '@/api/admin'
import type { PageUserResponseDto, UserResponseDto } from '@/api/types'
import {
  Badge,
  Button,
  HexAvatar,
  Input,
  RouteLoader,
  Section,
  useToast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

const PAGE_SIZE = 20

type SearchMode = 'username' | 'email' | 'id'

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'E-mail' },
  { value: 'id', label: 'ID' },
]

// ROLE_USER to domyślna rola; pokazujemy tylko pozostałe, bez prefiksu ROLE_.
function extraRoles(roles: readonly string[]): string[] {
  return roles.filter((r) => r !== 'ROLE_USER').map((r) => r.replace(/^ROLE_/, ''))
}

function UserRow({ user }: { user: UserResponseDto }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
      <HexAvatar name={user.username} src={user.profile?.profilePictureUrl} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-on-surface">{user.username}</p>
        <p className="truncate text-sm text-on-surface-variant">{user.email}</p>
        <p className="truncate font-mono text-xs text-on-surface-variant/50" title={user.id}>
          {user.id}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {extraRoles(user.roles).map((r) => (
          <Badge key={r} tone="gold">
            {r}
          </Badge>
        ))}
        <Badge tone={user.enabled ? 'success' : 'danger'}>
          {user.enabled ? 'Aktywny' : 'Nieaktywny'}
        </Badge>
      </div>
    </li>
  )
}

export default function AdminUsersPage() {
  const toast = useToast()

  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<PageUserResponseDto | null>(null)
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState<SearchMode>('username')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  // null = brak wyszukiwania (pokaż listę); 'notfound' = brak wyniku.
  const [result, setResult] = useState<UserResponseDto | 'notfound' | null>(null)

  // Stan ładowania ustawiamy w handlerach (zdarzenia), efekt robi tylko fetch
  // i setState w callbackach — bez synchronicznego setState w ciele efektu.
  useEffect(() => {
    let active = true
    listUsers({ page, size: PAGE_SIZE, sort: ['username,asc'] })
      .then((d) => active && setData(d))
      .catch((err) => active && toast.error(getApiErrorMessage(err)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [page, reloadKey, toast])

  const goToPage = (p: number) => {
    setLoading(true)
    setPage(Math.max(p, 0))
  }

  const reload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const onSearch = async (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setResult(null)
    try {
      const lookup =
        mode === 'email' ? getUserByEmail : mode === 'id' ? getUserById : getUserByUsername
      setResult(await lookup(q))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setResult('notfound')
      } else {
        toast.error(getApiErrorMessage(err))
      }
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setResult(null)
    setQuery('')
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Użytkownicy</h1>
        <p className="mt-1 text-on-surface-variant">
          Przeglądaj konta i wyszukuj po nazwie, e-mailu lub ID.
        </p>
      </header>

      <Section title="Szukaj użytkownika">
        <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-on-surface-variant">Pole</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SearchMode)}
              className="rounded-xl bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {SEARCH_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Szukana wartość"
            iconLeft="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'email' ? 'jan@example.com' : mode === 'id' ? 'UUID' : 'jan.kowalski'}
            className="min-w-[12rem] flex-1"
          />
          <Button type="submit" loading={searching} iconLeft="search">
            Szukaj
          </Button>
        </form>
      </Section>

      {result !== null ? (
        <Section
          title="Wynik wyszukiwania"
          action={
            <Button variant="secondary" size="sm" iconLeft="arrow_back" onClick={clearSearch}>
              Wróć do listy
            </Button>
          }
        >
          {result === 'notfound' ? (
            <p className="py-4 text-center text-on-surface-variant">
              Nie znaleziono użytkownika dla podanej wartości.
            </p>
          ) : (
            <ul className="space-y-2">
              <UserRow user={result} />
            </ul>
          )}
        </Section>
      ) : (
        <Section title="Wszyscy użytkownicy">
          {!data ? (
            loading ? (
              <RouteLoader />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center text-on-surface-variant">
                <p>Nie udało się wczytać użytkowników.</p>
                <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                  Spróbuj ponownie
                </Button>
              </div>
            )
          ) : data.empty ? (
            <p className="py-4 text-center text-on-surface-variant">Brak użytkowników.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {data.content.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-sm text-on-surface-variant">
                  {data.totalElements} użytkownik(ów) · strona {data.number + 1} z{' '}
                  {Math.max(data.totalPages, 1)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft="chevron_left"
                    disabled={data.first || loading}
                    onClick={() => goToPage(data.number - 1)}
                  >
                    Poprzednia
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconRight="chevron_right"
                    disabled={data.last || loading}
                    onClick={() => goToPage(data.number + 1)}
                  >
                    Następna
                  </Button>
                </div>
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  )
}
