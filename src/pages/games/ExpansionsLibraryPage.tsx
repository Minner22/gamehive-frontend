import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listExpansions, type ExpansionLibraryFilter } from '@/api/expansions'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { CollectionButton } from '@/components/games/CollectionButton'
import { ExpansionFiltersForm } from '@/components/games/ExpansionFiltersForm'
import { ResultsSection } from '@/components/games/ResultsSection'
import { Button, ButtonLink, EmptyState } from '@/components/ui'
import { expansionFiltersToParams, parseExpansionFilters, parsePageParam } from '@/lib/gameFilters'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useTaxonomyOptions } from '@/lib/useTaxonomyOptions'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 12

export default function ExpansionsLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const filters = useMemo(() => parseExpansionFilters(new URLSearchParams(query)), [query])
  const urlPage = useMemo(() => parsePageParam(new URLSearchParams(query)), [query])

  const fetchPage = useCallback(
    (page: number) => listExpansions(filters, { page, size: PAGE_SIZE }),
    [filters],
  )
  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage, urlPage)
  const { categories, mechanics } = useTaxonomyOptions()

  // „Wstecz"/„dalej" zmienia adres — lista podąża za numerem strony.
  useEffect(() => {
    if (data && data.number !== urlPage) goToPage(urlPage)
  }, [data, urlPage, goToPage])

  const applyFilters = (next: ExpansionLibraryFilter) => {
    setSearchParams(expansionFiltersToParams(next))
    goToPage(0)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    goToPage(0)
  }

  const changePage = (page: number) => {
    setSearchParams(expansionFiltersToParams(filters, page))
    goToPage(page)
  }

  // Nazwa gry bazowej jest w każdym dodatku, więc nagłówek zawężenia bierzemy z danych,
  // zamiast dociągać grę tylko po tytuł.
  const baseGameTitle = filters.baseGameId ? data?.content[0]?.baseGameTitle : undefined

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Dodatki</h1>
        <p className="mt-1 text-on-surface-variant">
          Zatwierdzone dodatki do gier z biblioteki. Puste pola dodatku znaczą, że dziedziczy je
          z gry bazowej.
        </p>
      </header>

      {filters.baseGameId !== undefined && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3 text-sm">
          <span className="text-on-surface-variant">
            Pokazujemy dodatki do gry{baseGameTitle ? `: ${baseGameTitle}` : ''}.
          </span>
          <ButtonLink
            to={ROUTES.games.detail(filters.baseGameId)}
            size="sm"
            variant="secondary"
            iconLeft="sports_esports"
          >
            Zobacz grę
          </ButtonLink>
          <Button size="sm" variant="ghost" iconLeft="clear" onClick={clearFilters}>
            Pokaż wszystkie
          </Button>
        </div>
      )}

      {/* key: zmiana adresu (np. „wstecz") odtwarza formularz z nowych filtrów */}
      <ExpansionFiltersForm
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
        loadingLabel="Ładowanie dodatków…"
        errorTitle="Nie udało się wczytać dodatków"
        unit={pluralPl(data?.totalElements ?? 0, 'dodatek', 'dodatki', 'dodatków')}
        skeletonClassName="h-44"
        empty={
          <EmptyState
            icon="search_off"
            title="Brak dodatków dla wybranych filtrów"
            description="Poluzuj kryteria albo wyczyść filtry, żeby zobaczyć wszystkie zatwierdzone dodatki."
            action={
              <Button variant="secondary" iconLeft="clear" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            }
          />
        }
      >
        {(expansion) => (
          <ExpansionCard
            key={expansion.id}
            expansion={expansion}
            showBaseGame
            action={
              <CollectionButton target="expansion" id={expansion.id} name={expansion.name} />
            }
          />
        )}
      </ResultsSection>
    </div>
  )
}
