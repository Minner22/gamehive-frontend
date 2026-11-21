import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import type { ApiError } from '@/api/types'
import { CatalogFiltersForm } from '@/components/games/CatalogFiltersForm'
import { CollectionButton } from '@/components/games/CollectionButton'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { GameCard } from '@/components/games/GameCard'
import { ResultsSection } from '@/components/games/ResultsSection'
import { Button, ButtonLink, Chip, EmptyState, Input } from '@/components/ui'
import {
  applicableFilters,
  catalogItemKey,
  catalogQueryToParams,
  catalogSource,
  databaseQuery,
  fetchCatalogPage,
  parseCatalogQuery,
  parsePageParam,
  type CatalogFilters,
  type CatalogItem,
  type CatalogQuery,
  type CatalogType,
} from '@/lib/catalog'
import { pluralPl } from '@/lib/plural'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useTaxonomyOptions } from '@/lib/useTaxonomyOptions'
import { ROUTES } from '@/routes/paths'

/** Trzy kolumny na dużym ekranie — strona domyka się równymi rzędami. */
const PAGE_SIZE = 12

/**
 * Sufit Meilisearch (`maxTotalHits`): powyżej tej liczby licznik staje w miejscu,
 * a dalsze strony wracają puste mimo istnienia trafień. Dotyczy tylko wyszukiwarki —
 * odczyt z bazy nie ma limitu.
 */
const MAX_TOTAL_HITS = 1000

const TABS: { type: CatalogType; label: string }[] = [
  { type: 'game', label: 'Gry' },
  { type: 'expansion', label: 'Dodatki' },
  { type: 'all', label: 'Wszystko' },
]

const UNITS: Record<CatalogType, [string, string, string]> = {
  game: ['gra', 'gry', 'gier'],
  expansion: ['dodatek', 'dodatki', 'dodatków'],
  all: ['pozycja', 'pozycje', 'pozycji'],
}

const EMPTY_TITLES: Record<CatalogType, string> = {
  game: 'Brak gier dla wybranych kryteriów',
  expansion: 'Brak dodatków dla wybranych kryteriów',
  all: 'Brak trafień',
}

/** Wyszukiwarka stoi na Meilisearch — gdy silnik nie odpowiada, backend daje 503. */
function isSearchUnavailable(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const code = (error.response?.data as ApiError | undefined)?.errorCode
  return error.response?.status === 503 || code === 'SEARCH_INDEX_UNAVAILABLE'
}

function CatalogCard({ item }: Readonly<{ item: CatalogItem }>) {
  if (item.kind === 'expansion') {
    const { expansion } = item
    return (
      <ExpansionCard
        expansion={expansion}
        showBaseGame
        action={<CollectionButton target="expansion" id={expansion.id} name={expansion.name} />}
      />
    )
  }
  const { game } = item
  return (
    <GameCard
      game={game}
      action={<CollectionButton target="game" id={game.id} name={game.title} />}
    />
  )
}

/**
 * „Odkrywaj” — jeden ekran zamiast osobnych bibliotek gier, dodatków i wyszukiwarki.
 * Źródło danych wybiera `catalogSource`: baza, gdy wystarcza, wyszukiwarka przy
 * frazie, zakładce „Wszystko” albo filtrze, którego baza nie obsługuje.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Memo po samym query stringu — obiekt URLSearchParams zmienia tożsamość przy każdej nawigacji.
  const query = searchParams.toString()
  const catalog = useMemo(() => parseCatalogQuery(new URLSearchParams(query)), [query])
  const urlPage = useMemo(() => parsePageParam(new URLSearchParams(query)), [query])

  // Pole reaguje od razu, zapytanie leci po przerwie w pisaniu.
  const [term, setTerm] = useState(catalog.q ?? '')
  const debouncedTerm = useDebouncedValue(term)
  const [unavailable, setUnavailable] = useState(false)
  const { categories, mechanics } = useTaxonomyOptions()

  /**
   * Efektywne kryterium: adres, ale fraza z opóźnionego pola. Tożsamość liczona
   * przez round-trip po query stringu — inaczej dopisanie frazy do adresu (efekt
   * niżej) dawało nowy obiekt o tych samych wartościach i drugie, zbędne zapytanie.
   */
  const criteriaKey = useMemo(
    () => catalogQueryToParams({ ...catalog, q: debouncedTerm.trim() || undefined }).toString(),
    [catalog, debouncedTerm],
  )
  const effective = useMemo(() => parseCatalogQuery(new URLSearchParams(criteriaKey)), [criteriaKey])
  const source = catalogSource(effective)

  const fetchPage = useCallback(
    (page: number) =>
      fetchCatalogPage(effective, page, PAGE_SIZE).then((result) => {
        setUnavailable(false)
        return result
      }),
    [effective],
  )

  // 503 ma własny ekran, więc nie oddajemy go generycznemu toastowi z hooka.
  const handleError = useCallback((error: unknown) => {
    const unavailableNow = isSearchUnavailable(error)
    setUnavailable(unavailableNow)
    return unavailableNow
  }, [])

  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage, urlPage, handleError)

  // Fraza po debounce trafia do adresu, żeby wynik dało się wkleić w linku.
  useEffect(() => {
    const next = debouncedTerm.trim() || undefined
    if (next === catalog.q) return
    setSearchParams(catalogQueryToParams({ ...catalog, q: next }), { replace: true })
  }, [debouncedTerm, catalog, setSearchParams])

  // „Wstecz"/„dalej" zmienia adres — lista podąża za numerem strony.
  useEffect(() => {
    if (data && data.number !== urlPage) goToPage(urlPage)
  }, [data, urlPage, goToPage])

  /** Nowe kryteria zawsze od pierwszej strony. */
  const showQuery = (next: CatalogQuery) => {
    setSearchParams(catalogQueryToParams(next))
    goToPage(0)
  }

  const selectType = (type: CatalogType) =>
    showQuery({ type, q: catalog.q, filters: applicableFilters(type, catalog.filters) })

  const applyFilters = (filters: CatalogFilters) => showQuery({ ...catalog, filters })

  /** Czyści frazę i filtry, ale zostaje na tej samej zakładce. */
  const clearAll = () => {
    setTerm('')
    showQuery({ type: catalog.type, filters: {} })
  }

  const browseWithoutSearch = () => {
    setTerm('')
    showQuery(databaseQuery(catalog))
  }

  const changePage = (page: number) => {
    setSearchParams(catalogQueryToParams(catalog, page))
    goToPage(page)
  }

  const { baseGameId, authorId } = catalog.filters
  // Tytuł gry bazowej jest w każdym dodatku — nie dociągamy gry tylko po nazwę.
  const baseGameTitle = useMemo(() => {
    const first = data?.content.find((item) => item.kind === 'expansion')
    return first?.kind === 'expansion' ? first.expansion.baseGameTitle : undefined
  }, [data])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight">Odkrywaj</h1>
          <p className="mt-1 text-on-surface-variant">
            Gry i dodatki zatwierdzone przez moderatorów — wspólny katalog całego ula.
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

      <div className="space-y-4">
        <Input
          label="Szukaj"
          type="search"
          iconLeft="search"
          placeholder="tytuł, opis albo gra bazowa — np. wingspan, ptaki"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rodzaj pozycji">
          {TABS.map((tab) => (
            <Chip
              key={tab.type}
              selected={catalog.type === tab.type}
              onClick={() => selectType(tab.type)}
            >
              {tab.label}
            </Chip>
          ))}
        </div>
      </div>

      {baseGameId !== undefined && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3 text-sm">
          <span className="text-on-surface-variant">
            Pokazujemy dodatki do gry{baseGameTitle ? `: ${baseGameTitle}` : ''}.
          </span>
          <ButtonLink
            to={ROUTES.games.detail(baseGameId)}
            size="sm"
            variant="secondary"
            iconLeft="sports_esports"
          >
            Zobacz grę
          </ButtonLink>
          <Button
            size="sm"
            variant="ghost"
            iconLeft="clear"
            onClick={() => applyFilters({ ...catalog.filters, baseGameId: undefined })}
          >
            Pokaż wszystkie dodatki
          </Button>
        </div>
      )}

      {authorId !== undefined && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3 text-sm">
          <span className="text-on-surface-variant">Wyniki zawężone do jednego autora.</span>
          <Button
            size="sm"
            variant="ghost"
            iconLeft="clear"
            onClick={() => applyFilters({ ...catalog.filters, authorId: undefined })}
          >
            Usuń zawężenie
          </Button>
        </div>
      )}

      {/* key: zmiana adresu (np. „wstecz") odtwarza formularz z nowych filtrów */}
      <CatalogFiltersForm
        key={query}
        type={catalog.type}
        initialFilters={catalog.filters}
        categories={categories}
        mechanics={mechanics}
        onApply={applyFilters}
        onClear={clearAll}
      />

      {unavailable ? (
        <EmptyState
          icon="search_off"
          title="Wyszukiwarka jest chwilowo niedostępna"
          description="Silnik wyszukiwania nie odpowiada. Przeglądanie bez frazy działa normalnie — czyta prosto z bazy."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" iconLeft="menu_book" onClick={browseWithoutSearch}>
                Przeglądaj bez wyszukiwania
              </Button>
              <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                Spróbuj ponownie
              </Button>
            </div>
          }
        />
      ) : (
        <ResultsSection
          data={data}
          loading={loading}
          onReload={reload}
          onPageChange={changePage}
          loadingLabel="Ładowanie katalogu…"
          errorTitle="Nie udało się wczytać katalogu"
          unit={pluralPl(data?.totalElements ?? 0, ...UNITS[catalog.type])}
          empty={
            <EmptyState
              icon="search_off"
              title={EMPTY_TITLES[catalog.type]}
              description="Spróbuj innej frazy albo poluzuj filtry — katalog obejmuje wyłącznie pozycje zatwierdzone."
              action={
                <Button variant="secondary" iconLeft="clear" onClick={clearAll}>
                  Wyczyść kryteria
                </Button>
              }
            />
          }
          footer={
            source === 'search' && data && data.totalElements >= MAX_TOTAL_HITS ? (
              <p className="text-xs text-on-surface-variant">
                Pokazujemy pierwsze {MAX_TOTAL_HITS} trafień — zawęź zapytanie, żeby zobaczyć resztę.
              </p>
            ) : null
          }
        >
          {(item) => <CatalogCard key={catalogItemKey(item)} item={item} />}
        </ResultsSection>
      )}
    </div>
  )
}
