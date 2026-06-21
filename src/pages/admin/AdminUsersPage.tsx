import { type FormEvent, useCallback, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  listUsers,
} from '@/api/admin'
import type { UserResponseDto } from '@/api/types'
import {
  Badge,
  Button,
  HexAvatar,
  Icon,
  Input,
  Pagination,
  Section,
  Select,
  Spinner,
  useToast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'
import { displayRoles } from '@/lib/roles'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { UserActionsDialog } from './UserActionsDialog'

const PAGE_SIZE = 20

type SearchMode = 'username' | 'email' | 'id'

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'E-mail' },
  { value: 'id', label: 'ID' },
]

function UserRow({
  user,
  onSelect,
}: {
  user: UserResponseDto
  onSelect: (user: UserResponseDto) => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(user)}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low p-3 text-left transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <HexAvatar name={user.username} src={user.profile?.profilePictureUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-on-surface">{user.username}</p>
          <p className="truncate text-sm text-on-surface-variant">{user.email}</p>
          <p className="truncate font-mono text-xs text-on-surface-variant/50" title={user.id}>
            {user.id}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {displayRoles(user.roles).map((r) => (
            <Badge key={r} tone="gold">
              {r}
            </Badge>
          ))}
          <Badge tone={user.enabled ? 'success' : 'danger'}>
            {user.enabled ? 'Aktywny' : 'Nieaktywny'}
          </Badge>
        </div>
        <Icon name="chevron_right" className="shrink-0 text-on-surface-variant/50" />
      </button>
    </li>
  )
}

export default function AdminUsersPage() {
  const toast = useToast()

  const fetchPage = useCallback(
    (page: number) => listUsers({ page, size: PAGE_SIZE, sort: ['username,asc'] }),
    [],
  )
  const { data, loading, goToPage, reload, setData } = usePaginatedList(fetchPage)

  const [mode, setMode] = useState<SearchMode>('username')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  // null = brak wyszukiwania (pokaż listę); 'notfound' = brak wyniku.
  const [result, setResult] = useState<UserResponseDto | 'notfound' | null>(null)

  // Użytkownik wybrany do akcji (otwiera dialog).
  const [selected, setSelected] = useState<UserResponseDto | null>(null)

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

  // Po akcji aktualizujemy stan lokalnie (lista + ewentualny wynik wyszukiwania
  // + otwarty dialog), bez ponownego pobierania.
  const handleUpdated = (u: UserResponseDto) => {
    setData((d) => (d ? { ...d, content: d.content.map((x) => (x.id === u.id ? u : x)) } : d))
    setResult((r) => (r && r !== 'notfound' && r.id === u.id ? u : r))
    setSelected(u)
  }

  const handleDeleted = (id: string) => {
    setData((d) =>
      d
        ? {
            ...d,
            content: d.content.filter((x) => x.id !== id),
            totalElements: Math.max(d.totalElements - 1, 0),
          }
        : d,
    )
    setResult((r) => (r && r !== 'notfound' && r.id === id ? null : r))
    setSelected(null)
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
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-44">
            <Select
              label="Pole"
              value={mode}
              onChange={(e) => setMode(e.target.value as SearchMode)}
            >
              {SEARCH_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Input
              label="Szukana wartość"
              iconLeft="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'email' ? 'jan@example.com' : mode === 'id' ? 'UUID' : 'jan.kowalski'}
            />
          </div>
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
              <UserRow user={result} onSelect={setSelected} />
            </ul>
          )}
        </Section>
      ) : (
        <Section title="Wszyscy użytkownicy">
          {!data ? (
            loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="text-3xl text-primary" />
              </div>
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
              <ul className="space-y-2" aria-live="polite" aria-busy={loading}>
                {data.content.map((u) => (
                  <UserRow key={u.id} user={u} onSelect={setSelected} />
                ))}
              </ul>
              <Pagination
                number={data.number}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                isFirst={data.first}
                isLast={data.last}
                disabled={loading}
                onChange={goToPage}
                unit="użytkownik(ów)"
              />
            </>
          )}
        </Section>
      )}

      {selected && (
        <UserActionsDialog
          key={selected.id}
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
