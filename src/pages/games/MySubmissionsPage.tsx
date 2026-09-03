import { type ReactNode, useCallback, useState } from 'react'
import { listMyExpansions, submitExpansion } from '@/api/expansions'
import { listMyGames, submitGame } from '@/api/games'
import type { ModerationStatus, Page } from '@/api/types'
import { ResultsSection } from '@/components/games/ResultsSection'
import { SubmissionCard, type SubmissionEntry } from '@/components/games/SubmissionCard'
import { ButtonLink, Chip, EmptyState } from '@/components/ui'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 12

type Tab = 'games' | 'expansions'

const TABS: { value: Tab; label: string }[] = [
  { value: 'games', label: 'Gry' },
  { value: 'expansions', label: 'Dodatki' },
]

interface SubmissionsTabProps<T> {
  fetchPage: (page: number) => Promise<Page<T>>
  unit: (count: number) => string
  empty: ReactNode
  /** Mapowanie encji na wspólny kształt zgłoszenia (tytuł, trasy, wysyłka). */
  toEntry: (item: T) => SubmissionEntry
  /** Podmiana statusu pozycji po udanej wysyłce — bez pobierania strony na nowo. */
  withStatus: (item: T, status: ModerationStatus) => T
}

/**
 * Zakładka zgłoszeń. Gry i dodatki mają ten sam przepływ (szkic → moderacja →
 * odrzucenie → poprawka), więc różnią się tylko mapowaniem encji na `SubmissionEntry`.
 */
function SubmissionsTab<T extends { id: number }>({
  fetchPage,
  unit,
  empty,
  toEntry,
  withStatus,
}: Readonly<SubmissionsTabProps<T>>) {
  const { data, loading, goToPage, reload, setData } = usePaginatedList(fetchPage)

  const applyStatus = (id: number, status: ModerationStatus) =>
    setData((current) =>
      current
        ? {
            ...current,
            content: current.content.map((item) =>
              item.id === id ? withStatus(item, status) : item,
            ),
          }
        : current,
    )

  return (
    <ResultsSection
      data={data}
      loading={loading}
      onReload={reload}
      onPageChange={goToPage}
      loadingLabel="Ładowanie zgłoszeń…"
      errorTitle="Nie udało się wczytać zgłoszeń"
      unit={unit(data?.totalElements ?? 0)}
      skeletonClassName="h-56"
      empty={empty}
    >
      {(item) => (
        <SubmissionCard
          key={item.id}
          entry={toEntry(item)}
          onSubmitted={(status) => applyStatus(item.id, status)}
        />
      )}
    </ResultsSection>
  )
}

export default function MySubmissionsPage() {
  const [tab, setTab] = useState<Tab>('games')

  const fetchGames = useCallback((page: number) => listMyGames({ page, size: PAGE_SIZE }), [])
  const fetchExpansions = useCallback(
    (page: number) => listMyExpansions({ page, size: PAGE_SIZE }),
    [],
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight">Moje zgłoszenia</h1>
          <p className="mt-1 text-on-surface-variant">
            Szkice i pozycje w moderacji. Zatwierdzone trafiają do biblioteki i znikają z tej listy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={ROUTES.games.new} iconLeft="add">
            Zgłoś grę
          </ButtonLink>
          <ButtonLink to={ROUTES.expansions.new} variant="secondary" iconLeft="add">
            Zgłoś dodatek
          </ButtonLink>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((entry) => (
          <Chip
            key={entry.value}
            selected={tab === entry.value}
            onClick={() => setTab(entry.value)}
          >
            {entry.label}
          </Chip>
        ))}
      </div>

      {/* key na zakładkę: inaczej React reużyłby instancję listy razem z jej danymi */}
      {tab === 'games' ? (
        <SubmissionsTab
          key="games"
          fetchPage={fetchGames}
          unit={(count) => pluralPl(count, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}
          toEntry={(game) => ({
            id: game.id,
            name: game.title,
            status: game.moderationStatus,
            rejectionReason: game.rejectionReason,
            detailHref: ROUTES.games.detail(game.id),
            editHref: ROUTES.games.edit(game.id),
            submit: async () => (await submitGame(game.id)).moderationStatus,
          })}
          withStatus={(game, moderationStatus) => ({ ...game, moderationStatus })}
          empty={
            <EmptyState
              icon="add_circle"
              title="Nie masz jeszcze żadnych zgłoszeń gier"
              description="Dodaj grę, której brakuje w bibliotece — po zatwierdzeniu zobaczą ją wszyscy."
              action={
                <ButtonLink to={ROUTES.games.new} variant="secondary" iconLeft="add">
                  Zgłoś grę
                </ButtonLink>
              }
            />
          }
        />
      ) : (
        <SubmissionsTab
          key="expansions"
          fetchPage={fetchExpansions}
          unit={(count) => pluralPl(count, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}
          toEntry={(expansion) => ({
            id: expansion.id,
            name: expansion.name,
            status: expansion.moderationStatus,
            rejectionReason: expansion.rejectionReason,
            detailHref: ROUTES.expansions.detail(expansion.id),
            editHref: ROUTES.expansions.edit(expansion.id),
            submit: async () => (await submitExpansion(expansion.id)).moderationStatus,
          })}
          withStatus={(expansion, moderationStatus) => ({ ...expansion, moderationStatus })}
          empty={
            <EmptyState
              icon="extension"
              title="Nie masz jeszcze żadnych zgłoszeń dodatków"
              description="Dodatek zgłasza się do konkretnej gry z biblioteki."
              action={
                <ButtonLink to={ROUTES.expansions.new} variant="secondary" iconLeft="add">
                  Zgłoś dodatek
                </ButtonLink>
              }
            />
          }
        />
      )}
    </div>
  )
}
