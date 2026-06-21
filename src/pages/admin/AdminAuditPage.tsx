import { type FormEvent, useEffect, useRef, useState } from 'react'
import { listAuditLogs, type AuditLogFilter } from '@/api/admin'
import type { AuditAction, AuditLogResponseDto, PageAuditLogResponseDto } from '@/api/types'
import {
  Badge,
  Button,
  Icon,
  Input,
  Pagination,
  Section,
  Spinner,
  useToast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

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

function AuditRow({ entry }: { entry: AuditLogResponseDto }) {
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    tone: 'neutral' as ActionTone,
    icon: 'history',
  }
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
        {entry.details && (
          <p className="truncate text-xs text-on-surface-variant" title={entry.details}>
            {entry.details}
          </p>
        )}
        <p
          className="truncate font-mono text-[10px] text-on-surface-variant/50"
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
  const toast = useToast()

  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [filters, setFilters] = useState<AuditLogFilter>({})
  const [data, setData] = useState<PageAuditLogResponseDto | null>(null)
  const [loading, setLoading] = useState(true)
  const loadedPage = useRef(0)

  const [draft, setDraft] = useState(EMPTY_DRAFT)

  useEffect(() => {
    let active = true
    listAuditLogs(filters, { page, size: PAGE_SIZE })
      .then((d) => {
        if (!active) return
        setData(d)
        loadedPage.current = d.number
      })
      .catch((err) => {
        if (!active) return
        toast.error(getApiErrorMessage(err))
        setPage(loadedPage.current)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [page, filters, reloadKey, toast])

  const goToPage = (p: number) => {
    setLoading(true)
    setPage(Math.max(p, 0))
  }

  const reload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const applyFilters = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFilters({
      action: draft.action || undefined,
      actor: draft.actor.trim() || undefined,
      targetId: draft.targetId.trim() || undefined,
      from: toIso(draft.from),
      to: toIso(draft.to),
    })
    setPage(0)
  }

  const clearFilters = () => {
    setDraft(EMPTY_DRAFT)
    setLoading(true)
    setFilters({})
    setPage(0)
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
            <label className="flex flex-col gap-1.5">
              <span className="px-1 text-sm font-semibold text-on-surface-variant">Operacja</span>
              <select
                value={draft.action}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, action: e.target.value as '' | AuditAction }))
                }
                className="w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3.5 text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Wszystkie</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {ACTION_META[a].label}
                  </option>
                ))}
              </select>
            </label>
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
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
            <Input
              label="Do"
              type="datetime-local"
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
