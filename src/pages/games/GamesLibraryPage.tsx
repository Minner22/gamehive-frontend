import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listGames, type GameLibraryFilter } from '@/api/games'
import { listCategories, listMechanics } from '@/api/taxonomy'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { GameCard } from '@/components/games/GameCard'
import { GameFiltersForm } from '@/components/games/GameFiltersForm'
import { Button, EmptyState, ListSkeleton, Pagination, useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'
import { gameFiltersToParams, parseGameFilters, parsePageParam } from '@/lib/gameFilters'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'

/** Trzy kolumny na dużym ekranie — strona domyka się równymi rzędami. */
const PAGE_SIZE = 12

export default function GamesLibraryPage() {
  const toast = useToast()
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

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [mechanics, setMechanics] = useState<MechanicDto[]>([])

  // Słowniki kuratorowane — krótkie listy, pobierane raz przy wejściu na stronę.
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
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Biblioteka gier</h1>
        <p className="mt-1 text-on-surface-variant">
          Gry zatwierdzone przez moderatorów — wspólny katalog całego ula.
        </p>
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

      {!data ? (
        loading ? (
          <>
            <p className="sr-only" role="status">
              Ładowanie gier…
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <ListSkeleton count={6} />
            </div>
          </>
        ) : (
          <EmptyState
            icon="cloud_off"
            title="Nie udało się wczytać biblioteki"
            description="Sprawdź połączenie i spróbuj ponownie."
            action={
              <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                Spróbuj ponownie
              </Button>
            }
          />
        )
      ) : data.empty ? (
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
      ) : (
        <div className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
            {data.content.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          <Pagination
            number={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            isFirst={data.first}
            isLast={data.last}
            disabled={loading}
            onChange={changePage}
            unit={pluralPl(data.totalElements, 'gra', 'gry', 'gier')}
          />
        </div>
      )}
    </div>
  )
}
