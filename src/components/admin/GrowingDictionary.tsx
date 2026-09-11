import { useCallback, useState } from 'react'
import type { TaxonomyFilter } from '@/api/adminTaxonomy'
import type { Page, TaxonomyStatus } from '@/api/types'
import { Badge, Button, Chip, EmptyState, Input, Section, useToast } from '@/components/ui'
import { ResultsSection } from '@/components/games/ResultsSection'
import { pluralPl } from '@/lib/plural'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { DeleteEntryButton } from './DeleteEntryButton'
import { type DictionaryField, DictionaryEntryForm } from './DictionaryEntryForm'

interface GrowingEntry {
  id?: number
  status?: TaxonomyStatus
}

type StatusFilter = TaxonomyStatus | 'ALL'

/**
 * Domyślnie „Oczekujące": wpisy PENDING powstają przy zgłoszeniach użytkowników
 * i to one są realną pracą administratora — pełną listę da się włączyć jednym kliknięciem.
 */
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Oczekujące' },
  { value: 'APPROVED', label: 'Zatwierdzone' },
  { value: 'ALL', label: 'Wszystkie' },
]

const PAGE_SIZE = 20

export interface GrowingDictionaryProps<T extends GrowingEntry> {
  title: string
  addLabel: string
  /** Odmiana rzeczownika do licznika stronicowania. */
  noun: readonly [one: string, few: string, many: string]
  /** Pola wpisu — wydawca ma nazwę, autor imię i nazwisko. */
  fields: readonly DictionaryField[]
  /** Musi być stabilne (`useCallback`). */
  fetchPage: (filter: TaxonomyFilter, page: number, size: number) => Promise<Page<T>>
  labelOf: (item: T) => string
  create: (values: Record<string, string>) => Promise<unknown>
  approve: (id: number) => Promise<T>
  remove: (id: number) => Promise<void>
  /** Tylko tam, gdzie backend pozwala edytować (autorzy); wydawcy nie mają PUT. */
  update?: (id: number, values: Record<string, string>) => Promise<T>
  valuesOf?: (item: T) => Record<string, string>
}

interface EntriesProps<T extends GrowingEntry> extends GrowingDictionaryProps<T> {
  filter: TaxonomyFilter
}

/** Lista dla jednego zestawu filtrów — przemontowywana przez `key`, więc zawsze od strony 0. */
function Entries<T extends GrowingEntry>({
  filter,
  noun,
  fetchPage,
  labelOf,
  approve,
  remove,
  update,
  valuesOf,
  fields,
}: Readonly<EntriesProps<T>>) {
  const toast = useToast()
  const fetchFiltered = useCallback(
    (page: number) => fetchPage(filter, page, PAGE_SIZE),
    [fetchPage, filter],
  )
  const { data, loading, goToPage, reload, setData } = usePaginatedList(fetchFiltered)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [approvingId, setApprovingId] = useState<number | null>(null)

  const replace = (updated: T) =>
    setData((current) =>
      current
        ? {
            ...current,
            content: current.content.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    )

  const drop = (id: number) =>
    setData((current) =>
      current
        ? {
            ...current,
            content: current.content.filter((item) => item.id !== id),
            totalElements: Math.max(current.totalElements - 1, 0),
          }
        : current,
    )

  const runApprove = async (id: number) => {
    setApprovingId(id)
    try {
      // Na liście „Oczekujące" pozycja zostaje z nowym statusem — lista nie skacze pod rękami.
      replace(await approve(id))
      toast.success('Zatwierdzono.')
    } catch {
      toast.error('Nie udało się zatwierdzić — odśwież listę i spróbuj ponownie.')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <ResultsSection
      data={data}
      loading={loading}
      onReload={reload}
      onPageChange={goToPage}
      loadingLabel="Ładowanie słownika…"
      errorTitle="Nie udało się wczytać słownika"
      unit={pluralPl(data?.totalElements ?? 0, noun[0], noun[1], noun[2])}
      skeletonCount={3}
      skeletonClassName="h-16"
      empty={<EmptyState icon="task_alt" title="Brak pozycji dla tego filtra" />}
    >
      {(item) => {
        if (item.id === undefined) return null
        const id = item.id
        const label = labelOf(item)
        return (
          <div key={id} className="rounded-2xl bg-surface-container-low p-3 sm:col-span-2 lg:col-span-3">
            {editingId === id && update && valuesOf ? (
              <DictionaryEntryForm
                fields={fields}
                initialValues={valuesOf(item)}
                submitLabel="Zapisz"
                onCancel={() => setEditingId(null)}
                onSubmit={async (values) => {
                  replace(await update(id, values))
                  toast.success('Zapisano zmiany.')
                  setEditingId(null)
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-on-surface">{label}</span>
                  {item.status === 'PENDING' && <Badge tone="gold">oczekuje</Badge>}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {item.status === 'PENDING' && (
                    <Button
                      size="sm"
                      iconLeft="check"
                      loading={approvingId === id}
                      onClick={() => void runApprove(id)}
                    >
                      Zatwierdź
                    </Button>
                  )}
                  {update && (
                    <Button size="sm" variant="ghost" iconLeft="edit" onClick={() => setEditingId(id)}>
                      Edytuj
                    </Button>
                  )}
                  <DeleteEntryButton
                    name={label}
                    onDelete={async () => {
                      await remove(id)
                      toast.success('Usunięto ze słownika.')
                      drop(id)
                    }}
                  />
                </span>
              </div>
            )}
          </div>
        )
      }}
    </ResultsSection>
  )
}

/**
 * Słownik rosnący (wydawcy, autorzy): przybywa go ze zgłoszeniami użytkowników, więc
 * lista jest stronicowana, ma filtr statusu i wyszukiwanie po nazwie (`?q=`).
 */
export function GrowingDictionary<T extends GrowingEntry>(props: Readonly<GrowingDictionaryProps<T>>) {
  const toast = useToast()
  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  // Po dodaniu wpisu lista musi się przeładować — nowy klucz przemontowuje ją od zera.
  const [revision, setRevision] = useState(0)

  const filter: TaxonomyFilter = {
    status: status === 'ALL' ? undefined : status,
    q: debouncedQuery.trim() || undefined,
  }
  const filterKey = `${status}|${filter.q ?? ''}|${revision}`

  return (
    <div className="space-y-6">
      <Section title={props.addLabel}>
        <p className="mb-3 text-sm text-on-surface-variant">
          Wpis dodany przez administratora jest od razu zatwierdzony.
        </p>
        <DictionaryEntryForm
          fields={props.fields}
          submitLabel="Dodaj"
          onSubmit={async (values) => {
            await props.create(values)
            toast.success('Dodano do słownika.')
            setRevision((current) => current + 1)
          }}
        />
      </Section>

      <Section title={props.title}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((entry) => (
              <Chip
                key={entry.value}
                selected={status === entry.value}
                onClick={() => setStatus(entry.value)}
              >
                {entry.label}
              </Chip>
            ))}
          </div>
          <Input
            label="Szukaj"
            type="search"
            iconLeft="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <FilteredEntries key={filterKey} {...props} filter={filter} />
        </div>
      </Section>
    </div>
  )
}

/** Obiekt filtra powstaje przy każdym renderze — stabilizujemy go w zakresie jednego klucza. */
function FilteredEntries<T extends GrowingEntry>(props: Readonly<EntriesProps<T>>) {
  const [stableFilter] = useState(props.filter)
  return <Entries {...props} filter={stableFilter} />
}
