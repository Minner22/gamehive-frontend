import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listExpansions, type ExpansionLibraryFilter } from '@/api/expansions'
import { listCategories, listMechanics } from '@/api/taxonomy'
import type { CategoryDto, MechanicDto, GameExpansionDto, Page } from '@/api/types'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { ExpansionFiltersForm } from '@/components/games/ExpansionFiltersForm'
import {
  Button,
  ButtonLink,
  EmptyState,
  ListSkeleton,
  Pagination,
  useToast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'
import { expansionFiltersToParams, parseExpansionFilters, parsePageParam } from '@/lib/gameFilters'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 12

interface ResultsProps {
  data: Page<GameExpansionDto> | null
  loading: boolean
  onReload: () => void
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

function ExpansionResults({
  data,
  loading,
  onReload,
  onPageChange,
  onClearFilters,
}: Readonly<ResultsProps>) {
  if (!data) {
    if (!loading) {
      return (
        <EmptyState
          icon="cloud_off"
          title="Nie udało się wczytać dodatków"
          description="Sprawdź połączenie i spróbuj ponownie."
          action={
            <Button variant="secondary" iconLeft="refresh" onClick={onReload}>
              Spróbuj ponownie
            </Button>
          }
        />
      )
    }
    return (
      <>
        <output className="sr-only">Ładowanie dodatków…</output>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          <ListSkeleton count={6} className="h-44" />
        </div>
      </>
    )
  }

  if (data.empty) {
    return (
      <EmptyState
        icon="search_off"
        title="Brak dodatków dla wybranych filtrów"
        description="Poluzuj kryteria albo wyczyść filtry, żeby zobaczyć wszystkie zatwierdzone dodatki."
        action={
          <Button variant="secondary" iconLeft="clear" onClick={onClearFilters}>
            Wyczyść filtry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
        {data.content.map((expansion) => (
          <ExpansionCard key={expansion.id} expansion={expansion} showBaseGame />
        ))}
      </div>
      <Pagination
        number={data.number}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        isFirst={data.first}
        isLast={data.last}
        disabled={loading}
        onChange={onPageChange}
        unit={pluralPl(data.totalElements, 'dodatek', 'dodatki', 'dodatków')}
      />
    </div>
  )
}

export default function ExpansionsLibraryPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const filters = useMemo(() => parseExpansionFilters(new URLSearchParams(query)), [query])
  const urlPage = useMemo(() => parsePageParam(new URLSearchParams(query)), [query])

  const fetchPage = useCallback(
    (page: number) => listExpansions(filters, { page, size: PAGE_SIZE }),
    [filters],
  )
  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage, urlPage)

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [mechanics, setMechanics] = useState<MechanicDto[]>([])

  useEffect(() => {
    let active = true
    Promise.all([listCategories(), listMechanics()])
      .then(([loadedCategories, loadedMechanics]) => {
        if (!active) return
        setCategories(loadedCategories)
        setMechanics(loadedMechanics)
      })
      .catch((err) => active && toast.error(getApiErrorMessage(err)))
    return () => {
      active = false
    }
  }, [toast])

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

      <ExpansionResults
        data={data}
        loading={loading}
        onReload={reload}
        onPageChange={changePage}
        onClearFilters={clearFilters}
      />
    </div>
  )
}
