import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { searchGames, type GameLibraryFilter, type GameSearchFilter } from '@/api/games'
import { listCategories, listMechanics } from '@/api/taxonomy'
import type { ApiError, CategoryDto, MechanicDto, SearchResultDto, SearchTargetType } from '@/api/types'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { GameCard } from '@/components/games/GameCard'
import { GameFiltersForm } from '@/components/games/GameFiltersForm'
import {
  Button,
  ButtonLink,
  Chip,
  EmptyState,
  Input,
  ListSkeleton,
  Pagination,
  Section,
  useToast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'
import { parsePageParam, parseSearchFilters, searchFiltersToParams } from '@/lib/gameFilters'
import { pluralPl } from '@/lib/plural'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 12

/**
 * Sufit Meilisearch (`maxTotalHits`): powyżej tej liczby licznik staje w miejscu,
 * a dalsze strony wracają puste mimo istnienia trafień. Lepiej to powiedzieć,
 * niż pozwolić użytkownikowi odkryć to samodzielnie.
 */
const MAX_TOTAL_HITS = 1000

const TARGET_TYPES: { value: SearchTargetType | ''; label: string }[] = [
  { value: '', label: 'Wszystko' },
  { value: 'GAME', label: 'Gry' },
  { value: 'EXPANSION', label: 'Dodatki' },
]

/** Wyszukiwarka stoi na Meilisearch — gdy silnik nie odpowiada, backend daje 503. */
function isSearchUnavailable(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const code = (error.response?.data as ApiError | undefined)?.errorCode
  return error.response?.status === 503 || code === 'SEARCH_INDEX_UNAVAILABLE'
}

function SearchResult({ result }: { result: SearchResultDto }) {
  if (result.targetType === 'EXPANSION' && result.expansion) {
    return <ExpansionCard expansion={result.expansion} showBaseGame />
  }
  if (result.game) return <GameCard game={result.game} />
  return null
}

export default function GameSearchPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const filters = useMemo(() => parseSearchFilters(new URLSearchParams(query)), [query])
  const urlPage = useMemo(() => parsePageParam(new URLSearchParams(query)), [query])

  // Pole reaguje od razu, zapytanie leci po przerwie w pisaniu.
  const [term, setTerm] = useState(filters.q ?? '')
  const debouncedTerm = useDebouncedValue(term)

  const [unavailable, setUnavailable] = useState(false)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [mechanics, setMechanics] = useState<MechanicDto[]>([])

  /**
   * Efektywne kryterium: filtry z adresu, ale fraza z opóźnionego pola.
   *
   * Tożsamość obiektu liczymy przez round-trip po query stringu — inaczej
   * dopisanie frazy do adresu (efekt niżej) dawałoby nowy obiekt o tych samych
   * wartościach i drugie, zbędne zapytanie na każde szukanie.
   */
  const criteriaKey = useMemo(
    () => searchFiltersToParams({ ...filters, q: debouncedTerm.trim() || undefined }).toString(),
    [filters, debouncedTerm],
  )
  const effectiveFilters = useMemo<GameSearchFilter>(
    () => parseSearchFilters(new URLSearchParams(criteriaKey)),
    [criteriaKey],
  )

  const fetchPage = useCallback(
    (page: number) => searchGames(effectiveFilters, { page, size: PAGE_SIZE }),
    [effectiveFilters],
  )

  // 503 ma własny ekran, więc nie oddajemy go generycznemu toastowi z hooka.
  const handleError = useCallback((error: unknown) => {
    const unavailableNow = isSearchUnavailable(error)
    setUnavailable(unavailableNow)
    return unavailableNow
  }, [])

  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage, urlPage, handleError)

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

  // Fraza po debounce trafia do adresu, żeby wynik dało się wkleić w linku.
  useEffect(() => {
    const next = debouncedTerm.trim() || undefined
    if (next === filters.q) return
    setSearchParams(searchFiltersToParams({ ...filters, q: next }), { replace: true })
  }, [debouncedTerm, filters, setSearchParams])

  // „Wstecz"/„dalej" zmienia adres — lista podąża za numerem strony.
  useEffect(() => {
    if (data && data.number !== urlPage) goToPage(urlPage)
  }, [data, urlPage, goToPage])

  const applyFilters = (next: GameLibraryFilter) => {
    setSearchParams(searchFiltersToParams({ ...filters, ...next }))
    goToPage(0)
  }

  const clearFilters = () => {
    setTerm('')
    setSearchParams(new URLSearchParams())
    goToPage(0)
  }

  const selectTargetType = (value: SearchTargetType | '') => {
    setSearchParams(searchFiltersToParams({ ...filters, targetType: value || undefined }))
    goToPage(0)
  }

  const changePage = (page: number) => {
    setSearchParams(searchFiltersToParams(filters, page))
    goToPage(page)
  }

  const narrowedByHiddenFilter = filters.authorId !== undefined || filters.baseGameId !== undefined

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Szukaj</h1>
        <p className="mt-1 text-on-surface-variant">
          Przeszukuje tytuły, opisy i nazwy gier bazowych — gry i dodatki naraz.
        </p>
      </header>

      <Section title="Zapytanie">
        <div className="space-y-4">
          <Input
            label="Fraza"
            type="search"
            iconLeft="search"
            placeholder="np. wingspan, ptaki, worker placement"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-on-surface-variant">Pokaż:</span>
            {TARGET_TYPES.map((type) => (
              <Chip
                key={type.label}
                selected={(filters.targetType ?? '') === type.value}
                onClick={() => selectTargetType(type.value)}
              >
                {type.label}
              </Chip>
            ))}
          </div>

          {narrowedByHiddenFilter && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3 text-sm">
              <span className="text-on-surface-variant">
                Wyniki zawężone dodatkowym filtrem z adresu (autor lub gra bazowa).
              </span>
              <Button size="sm" variant="secondary" iconLeft="clear" onClick={clearFilters}>
                Wyczyść
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* key: zmiana adresu (np. „wstecz") odtwarza formularz z nowych filtrów */}
      <GameFiltersForm
        key={query}
        initialFilters={filters}
        categories={categories}
        mechanics={mechanics}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <p className="text-xs text-on-surface-variant">
        Filtry wydawcy, autora i roku wydania dopasowują <strong>tylko gry</strong> — dodatki nie
        mają tych pól w modelu.
      </p>

      {unavailable ? (
        <EmptyState
          icon="search_off"
          title="Wyszukiwarka jest chwilowo niedostępna"
          description="Silnik wyszukiwania nie odpowiada. Biblioteka działa normalnie — czyta prosto z bazy."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink to={ROUTES.games.library} variant="secondary" iconLeft="menu_book">
                Przejdź do biblioteki
              </ButtonLink>
              <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                Spróbuj ponownie
              </Button>
            </div>
          }
        />
      ) : !data ? (
        loading ? (
          <>
            <p className="sr-only" role="status">
              Szukanie…
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <ListSkeleton count={3} />
            </div>
          </>
        ) : (
          <EmptyState
            icon="cloud_off"
            title="Nie udało się wyszukać"
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
          title="Brak trafień"
          description="Spróbuj innej frazy albo poluzuj filtry — wyszukiwarka obejmuje wyłącznie pozycje zatwierdzone."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
            {data.content.map((result) => (
              <SearchResult
                key={`${result.targetType}-${result.game?.id ?? result.expansion?.id}`}
                result={result}
              />
            ))}
          </div>

          {data.totalElements >= MAX_TOTAL_HITS && (
            <p className="text-xs text-on-surface-variant">
              Pokazujemy pierwsze {MAX_TOTAL_HITS} trafień — zawęź zapytanie, żeby zobaczyć resztę.
            </p>
          )}

          <Pagination
            number={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            isFirst={data.first}
            isLast={data.last}
            disabled={loading}
            onChange={changePage}
            unit={pluralPl(data.totalElements, 'trafienie', 'trafienia', 'trafień')}
          />
        </div>
      )}
    </div>
  )
}
