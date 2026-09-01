import { type ReactNode, useCallback, useState } from 'react'
import { listCollectionExpansions, listCollectionGames } from '@/api/collection'
import type { Page } from '@/api/types'
import { CollectionButton } from '@/components/games/CollectionButton'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { GameCard } from '@/components/games/GameCard'
import { ResultsSection } from '@/components/games/ResultsSection'
import { ButtonLink, Chip, EmptyState, Icon } from '@/components/ui'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 12

type Tab = 'games' | 'expansions'

const TABS: { value: Tab; label: string }[] = [
  { value: 'games', label: 'Gry' },
  { value: 'expansions', label: 'Dodatki' },
]

/** Data dodania — jedyna informacja, której nie niesie sama karta gry czy dodatku. */
function AddedAt({ iso }: Readonly<{ iso: string }>) {
  const date = new Date(iso)
  const label = Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(date)
  return (
    <p className="flex items-center gap-1 text-xs text-on-surface-variant">
      <Icon name="event_available" className="text-sm" aria-hidden="true" />
      Dodano {label}
    </p>
  )
}

interface CollectionTabProps<T> {
  fetchPage: (page: number) => Promise<Page<T>>
  unit: (count: number) => string
  empty: ReactNode
  skeletonClassName?: string
  /** Karta pozycji; `onRemoved` zdejmuje ją z listy po udanym usunięciu. */
  children: (item: T, onRemoved: () => void) => ReactNode
}

/**
 * Wspólna zakładka kolekcji. Gry i dodatki różnią się kartą i tekstami, nie
 * mechaniką: obie listy są stronicowane i obie zdejmują pozycję po usunięciu,
 * bez ponownego pobierania strony (ten sam chwyt co akcje w panelu admina).
 */
function CollectionTab<T extends { id: number; addedAt: string }>({
  fetchPage,
  unit,
  empty,
  skeletonClassName,
  children,
}: Readonly<CollectionTabProps<T>>) {
  const { data, loading, goToPage, reload, setData } = usePaginatedList(fetchPage)

  const dropItem = (id: number) =>
    setData((current) =>
      current
        ? {
            ...current,
            content: current.content.filter((entry) => entry.id !== id),
            totalElements: Math.max(current.totalElements - 1, 0),
          }
        : current,
    )

  return (
    <ResultsSection
      data={data}
      loading={loading}
      onReload={reload}
      onPageChange={goToPage}
      loadingLabel="Ładowanie kolekcji…"
      errorTitle="Nie udało się wczytać kolekcji"
      unit={unit(data?.totalElements ?? 0)}
      skeletonClassName={skeletonClassName}
      empty={empty}
    >
      {(item) => (
        <div key={item.id} className="flex flex-col gap-2">
          {children(item, () => dropItem(item.id))}
          <AddedAt iso={item.addedAt} />
        </div>
      )}
    </ResultsSection>
  )
}

export default function VaultPage() {
  const [tab, setTab] = useState<Tab>('games')

  const fetchGames = useCallback(
    (page: number) => listCollectionGames({ page, size: PAGE_SIZE }),
    [],
  )
  const fetchExpansions = useCallback(
    (page: number) => listCollectionExpansions({ page, size: PAGE_SIZE }),
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">The Vault</h1>
        <p className="mt-1 text-on-surface-variant">
          Twoja prywatna kolekcja — widzisz ją tylko Ty.
        </p>
      </header>

      {/* Chip niesie aria-pressed, więc przełącznik jest opisany bez dorabiania
          niepełnego wzorca tablist/tabpanel. */}
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

      {/* key na zakładkę: bez niego React reużywa instancję listy przy przełączeniu
          i przez chwilę renderuje pozycje gier kartą dodatku (albo odwrotnie). */}
      {tab === 'games' ? (
        <CollectionTab
          key="games"
          fetchPage={fetchGames}
          unit={(count) => pluralPl(count, 'gra', 'gry', 'gier')}
          empty={
            <EmptyState
              icon="inventory_2"
              title="Twoja kolekcja gier jest pusta"
              description="Dodawaj gry z biblioteki — będą tu czekać w jednym miejscu."
              action={
                <ButtonLink to={ROUTES.games.library} variant="secondary" iconLeft="menu_book">
                  Przeglądaj bibliotekę
                </ButtonLink>
              }
            />
          }
        >
          {(item, onRemoved) => (
            <GameCard
              game={item.game}
              action={
                <CollectionButton
                  target="game"
                  id={item.game.id}
                  name={item.game.title}
                  owned
                  onChange={(owned) => !owned && onRemoved()}
                />
              }
            />
          )}
        </CollectionTab>
      ) : (
        <CollectionTab
          key="expansions"
          fetchPage={fetchExpansions}
          unit={(count) => pluralPl(count, 'dodatek', 'dodatki', 'dodatków')}
          skeletonClassName="h-44"
          empty={
            <EmptyState
              icon="extension"
              title="Nie masz jeszcze żadnych dodatków"
              description="Dodatek dodaje się niezależnie od gry bazowej — nie musisz mieć jej w kolekcji."
              action={
                <ButtonLink to={ROUTES.expansions.library} variant="secondary" iconLeft="extension">
                  Przeglądaj dodatki
                </ButtonLink>
              }
            />
          }
        >
          {(item, onRemoved) => (
            <ExpansionCard
              expansion={item.expansion}
              showBaseGame
              action={
                <CollectionButton
                  target="expansion"
                  id={item.expansion.id}
                  name={item.expansion.name}
                  owned
                  onChange={(owned) => !owned && onRemoved()}
                />
              }
            />
          )}
        </CollectionTab>
      )}
    </div>
  )
}
