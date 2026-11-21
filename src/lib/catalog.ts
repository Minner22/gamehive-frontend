/**
 * Katalog („Odkrywaj”) — jeden ekran dla gier, dodatków i wyszukiwania.
 *
 * Adres jest źródłem prawdy: zakładka, fraza, filtry i strona żyją w query stringu,
 * więc wynik da się wkleić w linku, a „wstecz” cofa do poprzedniego zestawu.
 * Klucze filtrów są takie same jak parametry API — bez drugiego słownika nazw.
 *
 * Nazwa w kodzie jest neutralna („catalog”), bo etykieta „Odkrywaj” jest robocza
 * i ma się zmienić, gdy wejdą Ule (Hives).
 */
import { listExpansions } from '@/api/expansions'
import { listGames, searchGames } from '@/api/games'
import type { GameDto, GameExpansionDto, Page, SearchResultDto, SearchTargetType } from '@/api/types'
import { ROUTES } from '@/routes/paths'

/** Zakładka katalogu. `game` jest domyślna i nie trafia do adresu. */
export type CatalogType = 'game' | 'expansion' | 'all'

const CATALOG_TYPES: CatalogType[] = ['game', 'expansion', 'all']

/**
 * Filtry liczbowe. `publisherId` celowo poza listą: wybór wydawcy wymaga podpowiedzi
 * z `/suggest`, a pełna lista wydawców jest po stronie backendu @Deprecated.
 * `authorId` i `baseGameId` nie mają kontrolek — przychodzą z linków.
 */
export const CATALOG_FILTER_KEYS = [
  'categoryId',
  'mechanicId',
  'players',
  'maxPlayingTime',
  'yearPublished',
  'age',
  'authorId',
  'baseGameId',
] as const

export type CatalogFilterKey = (typeof CATALOG_FILTER_KEYS)[number]

export type CatalogFilters = Partial<Record<CatalogFilterKey, number>>

export interface CatalogQuery {
  type: CatalogType
  q?: string
  filters: CatalogFilters
}

/**
 * Które filtry mają sens w danej zakładce. Dodatek nie ma roku wydania ani autorów,
 * a gra nie ma gry bazowej — przy zmianie zakładki takie filtry są zrzucane, żeby
 * nie zawężały wyników po cichu do zera.
 */
const APPLICABLE: Record<CatalogType, readonly CatalogFilterKey[]> = {
  game: ['categoryId', 'mechanicId', 'players', 'maxPlayingTime', 'yearPublished', 'age', 'authorId'],
  expansion: ['categoryId', 'mechanicId', 'players', 'maxPlayingTime', 'age', 'baseGameId'],
  all: CATALOG_FILTER_KEYS,
}

/**
 * Filtry, które obsługuje odczyt z bazy (`GET /games`, `GET /expansions`). Dodatki
 * w bazie filtrują się tylko po słownikach i grze bazowej — liczba graczy, czas
 * i wiek dotyczą wartości *efektywnych*, co backend świadomie oddał wyszukiwarce.
 */
const DATABASE_FILTERS: Record<'game' | 'expansion', readonly CatalogFilterKey[]> = {
  game: ['categoryId', 'mechanicId', 'players', 'maxPlayingTime', 'yearPublished', 'age'],
  expansion: ['categoryId', 'mechanicId', 'baseGameId'],
}

/** `targetType` wyszukiwarki ↔ zakładka (w obie strony; „Wszystko” = brak parametru). */
const TARGET_BY_TYPE: Record<CatalogType, SearchTargetType | undefined> = {
  game: 'GAME',
  expansion: 'EXPANSION',
  all: undefined,
}
const TYPE_BY_TARGET: Record<string, CatalogType> = { GAME: 'game', EXPANSION: 'expansion' }

/** Skąd biorą się wyniki. Dla użytkownika to jeden ekran, dla nas trzy endpointy. */
export type CatalogSource = 'games' | 'expansions' | 'search'

/**
 * Reguła wyboru źródła: baza zawsze, gdy da radę — pełna lista bez sufitu 1000
 * trafień i bez zależności od Meilisearch. Wyszukiwarka dopiero przy frazie,
 * zakładce „Wszystko” (baza nie łączy gier z dodatkami) albo filtrze, którego
 * baza dla tej zakładki nie obsługuje.
 */
export function catalogSource({ type, q, filters }: CatalogQuery): CatalogSource {
  if (q || type === 'all') return 'search'
  const supported = DATABASE_FILTERS[type]
  const active = (Object.keys(filters) as CatalogFilterKey[]).filter((k) => filters[k] !== undefined)
  if (active.some((key) => !supported.includes(key))) return 'search'
  return type === 'game' ? 'games' : 'expansions'
}

/**
 * To samo zapytanie bez tego, co wymaga wyszukiwarki: bez frazy, „Wszystko” → „Gry”
 * i tylko filtry obsługiwane przez bazę. Wyjście awaryjne, gdy Meilisearch nie działa.
 */
export function databaseQuery({ type, filters }: CatalogQuery): CatalogQuery {
  const target = type === 'all' ? 'game' : type
  const kept: CatalogFilters = {}
  for (const key of DATABASE_FILTERS[target]) {
    if (filters[key] !== undefined) kept[key] = filters[key]
  }
  return { type: target, filters: kept }
}

export function isFilterApplicable(type: CatalogType, key: CatalogFilterKey): boolean {
  return APPLICABLE[type].includes(key)
}

/** Zostawia tylko filtry pasujące do zakładki. */
export function applicableFilters(type: CatalogType, filters: CatalogFilters): CatalogFilters {
  const result: CatalogFilters = {}
  for (const key of APPLICABLE[type]) {
    if (filters[key] !== undefined) result[key] = filters[key]
  }
  return result
}

// --- Adres ------------------------------------------------------------------

/** Wartości filtrów to dodatnie liczby całkowite; śmieci w ręcznie edytowanym adresie ignorujemy. */
function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === '') return undefined
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : undefined
}

/** Numer strony (0-based). Brak parametru, zero lub śmieci = pierwsza strona. */
export function parsePageParam(params: URLSearchParams): number {
  return parsePositiveInt(params.get('page')) ?? 0
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const rawType = params.get('type')
  const type = (CATALOG_TYPES as string[]).includes(rawType ?? '') ? (rawType as CatalogType) : 'game'

  const filters: CatalogFilters = {}
  for (const key of CATALOG_FILTER_KEYS) {
    const value = parsePositiveInt(params.get(key))
    if (value !== undefined) filters[key] = value
  }

  const q = params.get('q')?.trim() || undefined
  return { type, q, filters: applicableFilters(type, filters) }
}

/** Adres wynikowy: domyślna zakładka, puste filtry i pierwsza strona nie zaśmiecają query stringa. */
export function catalogQueryToParams({ type, q, filters }: CatalogQuery, page = 0): URLSearchParams {
  const params = new URLSearchParams()
  if (type !== 'game') params.set('type', type)
  if (q) params.set('q', q)
  for (const key of CATALOG_FILTER_KEYS) {
    const value = filters[key]
    if (value !== undefined && isFilterApplicable(type, key)) params.set(key, String(value))
  }
  if (page > 0) params.set('page', String(page))
  return params
}

/** Link do katalogu, np. „wszystkie dodatki do tej gry”. */
export function catalogHref(query: Partial<CatalogQuery> = {}): string {
  const params = catalogQueryToParams({ type: query.type ?? 'game', q: query.q, filters: query.filters ?? {} })
  const search = params.toString()
  return search ? `${ROUTES.games.library}?${search}` : ROUTES.games.library
}

/**
 * Stare adresy sprzed scalenia ekranów (`/games/search`, `/expansions`) — linki
 * i zakładki w przeglądarce mają dalej prowadzić w to samo miejsce.
 */
export function legacyCatalogHref(pathname: string, search: string): string {
  const params = new URLSearchParams(search)
  if (pathname.startsWith(ROUTES.expansions.library)) {
    params.set('type', 'expansion')
  } else {
    params.set('type', TYPE_BY_TARGET[params.get('targetType') ?? ''] ?? 'all')
    params.delete('targetType')
  }
  const target = catalogQueryToParams(parseCatalogQuery(params), parsePageParam(params)).toString()
  return target ? `${ROUTES.games.library}?${target}` : ROUTES.games.library
}

// --- Pobieranie -------------------------------------------------------------

/** Pozycja katalogu niezależnie od źródła — siatka renderuje jeden typ. */
export type CatalogItem =
  | { kind: 'game'; game: GameDto }
  | { kind: 'expansion'; expansion: GameExpansionDto }

export function catalogItemKey(item: CatalogItem): string {
  return item.kind === 'game' ? `game-${item.game.id}` : `expansion-${item.expansion.id}`
}

function mapPage<T>(page: Page<T>, map: (item: T) => CatalogItem | null): Page<CatalogItem> {
  return { ...page, content: page.content.map(map).filter((item) => item !== null) }
}

function fromSearchResult(result: SearchResultDto): CatalogItem | null {
  if (result.targetType === 'EXPANSION' && result.expansion) {
    return { kind: 'expansion', expansion: result.expansion }
  }
  return result.game ? { kind: 'game', game: result.game } : null
}

/** Jedna strona katalogu z właściwego źródła (patrz `catalogSource`). */
export async function fetchCatalogPage(
  query: CatalogQuery,
  page: number,
  size: number,
): Promise<Page<CatalogItem>> {
  const { type, q, filters } = query
  switch (catalogSource(query)) {
    case 'games':
      return mapPage(await listGames(filters, { page, size }), (game) => ({ kind: 'game', game }))
    case 'expansions':
      return mapPage(await listExpansions(filters, { page, size }), (expansion) => ({
        kind: 'expansion',
        expansion,
      }))
    case 'search':
      return mapPage(
        await searchGames(
          { ...filters, q, targetType: TARGET_BY_TYPE[type] },
          { page, size },
        ),
        fromSearchResult,
      )
  }
}
