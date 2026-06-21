import { type FormEvent, useCallback, useState } from 'react'
import { listAuditLogs, type AuditLogFilter } from '@/api/admin'
import type { AuditAction, AuditLogResponseDto } from '@/api/types'
import {
  Badge,
  Button,
  Icon,
  Input,
  Pagination,
  Section,
  Select,
  Spinner,
} from '@/components/ui'
import { roleLabel } from '@/lib/roles'
import { usePaginatedList } from '@/lib/usePaginatedList'

const PAGE_SIZE = 20

type ActionTone = 'success' | 'danger' | 'info' | 'neutral' | 'gold'

const ACTION_META: Record<AuditAction, { label: string; tone: ActionTone; icon: string }> = {
  ACTIVATE: { label: 'Aktywacja', tone: 'success', icon: 'check_circle' },
  DEACTIVATE: { label: 'Dezaktywacja', tone: 'danger', icon: 'block' },
  DELETE: { label: 'Usunięcie', tone: 'danger', icon: 'delete' },
  FORCE_LOGOUT: { label: 'Wymuszone wylogowanie', tone: 'info', icon: 'logout' },
  PASSWORD_CHANGE: { label: 'Zmiana hasła', tone: 'neutral', icon: 'password' },
  ROLE_CHANGE: { label: 'Zmiana ról', tone: 'gold', icon: 'shield_person' },
}

const ACTIONS = Object.keys(ACTION_META) as AuditAction[]

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

// datetime-local (czas lokalny) → ISO-8601 UTC oczekiwane przez API.
function toIso(local: string): string | undefined {
  if (!local) return undefined
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

type RoleChange = { before: string[]; after: string[] }

// details przy ROLE_CHANGE to JSON {before, after}. Reszta akcji — zwykły tekst.
function parseRoleChange(details?: string): RoleChange | null {
  if (!details) return null
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed?.before) && Array.isArray(parsed?.after)) {
      return { before: parsed.before, after: parsed.after }
    }
  } catch {
    /* nie JSON — pokażemy surowo */
  }
  return null
}

function RoleDiff({ change }: { change: RoleChange }) {
  const added = change.after.filter((r) => !change.before.includes(r))
  const removed = change.before.filter((r) => !change.after.includes(r))
  if (added.length === 0 && removed.length === 0) {
    return <p className="mt-1 text-xs text-on-surface-variant">Role bez zmian</p>
  }
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {added.map((r) => (
        <Badge key={`+${r}`} tone="success">
          + {roleLabel(r)}
        </Badge>
      ))}
      {removed.map((r) => (
        <Badge key={`-${r}`} tone="danger">
          − {roleLabel(r)}
        </Badge>
      ))}
    </div>
  )
}

function AuditRow({ entry }: { entry: AuditLogResponseDto }) {
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    tone: 'neutral' as ActionTone,
    icon: 'history',
  }
  const roleChange = entry.action === 'ROLE_CHANGE' ? parseRoleChange(entry.details) : null

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3">
      <Icon name={meta.icon} className="mt-0.5 text-xl text-secondary" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="text-xs text-on-surface-variant">
            {formatDateTime(entry.createdAt)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-on-surface">
          <span className="font-semibold">{entry.actor}</span>
          <span className="text-on-surface-variant"> → {entry.targetEmail}</span>
        </p>
        {roleChange ? (
          <RoleDiff change={roleChange} />
        ) : entry.details ? (
          <p className="truncate text-xs text-on-surface-variant" title={entry.details}>
            {entry.details}
          </p>
        ) : null}
        <p
          className="mt-0.5 truncate font-mono text-xs text-on-surface-variant/60"
          title={`użytkownik ${entry.targetId} · correlationId ${entry.correlationId}`}
        >
          {entry.correlationId}
        </p>
      </div>
    </li>
  )
}

const EMPTY_DRAFT = { action: '' as '' | AuditAction, actor: '', targetId: '', from: '', to: '' }

export default function AdminAuditPage() {
  const [filters, setFilters] = useState<AuditLogFilter>({})
  const fetchPage = useCallback(
    (page: number) => listAuditLogs(filters, { page, size: PAGE_SIZE }),
    [filters],
  )
  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage)

  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const applyFilters = (e: FormEvent) => {
    e.preventDefault()
    setFilters({
      action: draft.action || undefined,
      actor: draft.actor.trim() || undefined,
      targetId: draft.targetId.trim() || undefined,
      from: toIso(draft.from),
      to: toIso(draft.to),
    })
    goToPage(0) // nowy zestaw filtrów → od pierwszej strony
  }

  const clearFilters = () => {
    setDraft(EMPTY_DRAFT)
    setFilters({})
    goToPage(0)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Dziennik audytu</h1>
        <p className="mt-1 text-on-surface-variant">
          Operacje administracyjne na kontach użytkowników.
        </p>
      </header>

      <Section title="Filtry">
        <form onSubmit={applyFilters} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Operacja"
              value={draft.action}
              onChange={(e) =>
                setDraft((d) => ({ ...d, action: e.target.value as '' | AuditAction }))
              }
            >
              <option value="">Wszystkie</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_META[a].label}
                </option>
              ))}
            </Select>
            <Input
              label="Administrator (e-mail)"
              iconLeft="admin_panel_settings"
              value={draft.actor}
              onChange={(e) => setDraft((d) => ({ ...d, actor: e.target.value }))}
              placeholder="admin@gamehive.io"
            />
            <Input
              label="ID użytkownika (UUID)"
              iconLeft="person"
              value={draft.targetId}
              onChange={(e) => setDraft((d) => ({ ...d, targetId: e.target.value }))}
              placeholder="UUID"
            />
            <Input
              label="Od"
              type="datetime-local"
              hint="czas lokalny"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
            <Input
              label="Do"
              type="datetime-local"
              hint="czas lokalny"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" iconLeft="filter_list">
              Filtruj
            </Button>
            <Button type="button" variant="secondary" iconLeft="clear" onClick={clearFilters}>
              Wyczyść
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Wpisy">
        {!data ? (
          loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-3xl text-primary" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-on-surface-variant">
              <p>Nie udało się wczytać dziennika.</p>
              <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                Spróbuj ponownie
              </Button>
            </div>
          )
        ) : data.empty ? (
          <p className="py-4 text-center text-on-surface-variant">
            Brak wpisów dla wybranych filtrów.
          </p>
        ) : (
          <>
            <ul className="space-y-2" aria-live="polite" aria-busy={loading}>
              {data.content.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
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
              unit="wpis(ów)"
            />
          </>
        )}
      </Section>
    </div>
  )
}
