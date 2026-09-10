import { useCallback, useState } from 'react'
import type { ModerationQueueStatus, ModerationStatus, Page } from '@/api/types'
import { Chip, EmptyState } from '@/components/ui'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ModerationCard, type ModerationEntry } from './ModerationCard'
import { ResultsSection } from './ResultsSection'

/**
 * Kolejka ma dwa stany do pracy: oczekujące na decyzję i odrzucone, które można
 * odblokować autorowi. APPROVED i DRAFT backend odrzuca (400) — pierwsze znajduje
 * się przez bibliotekę, drugie jest prywatnym szkicem autora.
 */
const QUEUES: { value: ModerationQueueStatus; label: string }[] = [
  { value: 'PENDING', label: 'Oczekujące' },
  { value: 'REJECTED', label: 'Odrzucone' },
]

const PAGE_SIZE = 10

interface ModerationQueueProps<T extends { id: number; moderationStatus: ModerationStatus }> {
  title: string
  description: string
  /** Czego dotyczą zgłoszenia, w dopełniaczu — do komunikatu pustej kolejki („gry", „dodatku"). */
  subjectGenitive: string
  /** Musi być stabilne (`useCallback`) — zmiana tożsamości to ponowne pobranie. */
  fetchPage: (status: ModerationQueueStatus, page: number, size: number) => Promise<Page<T>>
  /** Mapowanie encji na kartę; status wylicza kolejka (decyzja z sesji ma pierwszeństwo). */
  toEntry: (item: T) => Omit<ModerationEntry, 'status'>
}

/**
 * Wspólna kolejka moderacji gier i dodatków. Obie encje mają identyczny przepływ
 * i te same kolejki, więc różnią się tylko endpointami i tym, co karta pokazuje.
 */
export function ModerationQueue<T extends { id: number; moderationStatus: ModerationStatus }>({
  title,
  description,
  subjectGenitive,
  fetchPage,
  toEntry,
}: Readonly<ModerationQueueProps<T>>) {
  const [queue, setQueue] = useState<ModerationQueueStatus>('PENDING')
  const fetchQueuePage = useCallback(
    (page: number) => fetchPage(queue, page, PAGE_SIZE),
    [fetchPage, queue],
  )
  const { data, loading, goToPage, reload } = usePaginatedList(fetchQueuePage)

  // Po decyzji zgłoszenie znika z kolejki po stronie backendu, ale zostaje na ekranie
  // z widocznym skutkiem — inaczej lista skakałaby moderatorowi pod rękami.
  const [decisions, setDecisions] = useState<Record<number, ModerationStatus>>({})

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-on-surface-variant">{description}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {QUEUES.map((entry) => (
          <Chip
            key={entry.value}
            selected={queue === entry.value}
            onClick={() => {
              setQueue(entry.value)
              goToPage(0)
            }}
          >
            {entry.label}
          </Chip>
        ))}
      </div>

      <ResultsSection
        data={data}
        loading={loading}
        onReload={reload}
        onPageChange={goToPage}
        loadingLabel="Ładowanie kolejki…"
        errorTitle="Nie udało się wczytać kolejki"
        unit={pluralPl(data?.totalElements ?? 0, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}
        skeletonClassName="h-64"
        empty={
          <EmptyState
            icon="task_alt"
            title={queue === 'PENDING' ? 'Kolejka jest pusta' : 'Brak odrzuconych zgłoszeń'}
            description={
              queue === 'PENDING'
                ? `Żadne zgłoszenie ${subjectGenitive} nie czeka teraz na decyzję.`
                : 'Nie ma zgłoszeń, które można odblokować autorowi.'
            }
          />
        }
      >
        {(item) => (
          <ModerationCard
            key={item.id}
            decided={decisions[item.id] !== undefined}
            onDecided={(status) => setDecisions((current) => ({ ...current, [item.id]: status }))}
            entry={{
              ...toEntry(item),
              status: decisions[item.id] ?? item.moderationStatus,
            }}
          />
        )}
      </ResultsSection>
    </div>
  )
}
