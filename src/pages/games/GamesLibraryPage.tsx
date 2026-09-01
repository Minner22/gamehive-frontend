import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listGames, type GameLibraryFilter } from '@/api/games'
import { GameCard } from '@/components/games/GameCard'
import { CollectionButton } from '@/components/games/CollectionButton'
import { GameFiltersForm } from '@/components/games/GameFiltersForm'
import { ResultsSection } from '@/components/games/ResultsSection'
import { Button, ButtonLink, EmptyState } from '@/components/ui'
import { gameFiltersToParams, parseGameFilters, parsePageParam } from '@/lib/gameFilters'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useTaxonomyOptions } from '@/lib/useTaxonomyOptions'
import { ROUTES } from '@/routes/paths'

/** Trzy kolumny na dużym ekranie — strona domyka się równymi rzędami. */
const PAGE_SIZE = 12

export default function GamesLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Adres jest źródłem prawdy dla filtrów i strony — memo po samym query stringu,
  // bo obiekt URLSearchParams zmienia tożsamość przy każdej nawigacji.
  const query = searchParams.toString()
  const filters = useMemo(() => parseGameFilters(new URLSearchParams(query)), [query])
  const urlPage = useMemo(() => parsePageParam(new URLSearchParams(query)), [query])

  const fetchPage = useCallback(
    (page: number) => listGames(filters, { page, size: PAGE_SIZE }),
    [filters],
  )
  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage, urlPage)

  const { categories, mechanics } = useTaxonomyOptions()

  // „Wstecz"/„dalej" zmienia adres — lista musi podążyć za numerem strony z URL-a.
  useEffect(() => {
    if (data && data.number !== urlPage) goToPage(urlPage)
  }, [data, urlPage, goToPage])

  const applyFilters = (next: GameLibraryFilter) => {
    setSearchParams(gameFiltersToParams(next))
    goToPage(0) // nowy zestaw filtrów → od pierwszej strony
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    goToPage(0)
  }

  const changePage = (page: number) => {
    setSearchParams(gameFiltersToParams(filters, page))
    goToPage(page)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight">Biblioteka gier</h1>
          <p className="mt-1 text-on-surface-variant">
            Gry zatwierdzone przez moderatorów — wspólny katalog całego ula.
          </p>
        </div>
        <ButtonLink to={ROUTES.games.new} iconLeft="add">
          Zgłoś grę
        </ButtonLink>
      </header>

      {/* key: zmiana adresu (np. „wstecz") odtwarza formularz z nowych filtrów */}
      <GameFiltersForm
        key={query}
        initialFilters={filters}
        categories={categories}
        mechanics={mechanics}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <ResultsSection
        data={data}
        loading={loading}
        onReload={reload}
        onPageChange={changePage}
        loadingLabel="Ładowanie gier…"
        errorTitle="Nie udało się wczytać biblioteki"
        unit={pluralPl(data?.totalElements ?? 0, 'gra', 'gry', 'gier')}
        empty={
          <EmptyState
            icon="search_off"
            title="Brak gier dla wybranych filtrów"
            description="Poluzuj kryteria albo wyczyść filtry, żeby zobaczyć całą bibliotekę."
            action={
              <Button variant="secondary" iconLeft="clear" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            }
          />
        }
      >
        {(game) => (
          <GameCard
            key={game.id}
            game={game}
            action={<CollectionButton target="game" id={game.id} name={game.title} />}
          />
        )}
      </ResultsSection>
    </div>
  )
}
