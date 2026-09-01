/**
 * Filtry biblioteki gier w query stringu — jedno źródło prawdy dla adresu strony.
 *
 * Dzięki temu wynik filtrowania da się wkleić komuś w linku, a przycisk „wstecz"
 * cofa do poprzedniego zestawu filtrów. Klucze są takie same jak parametry API,
 * więc nie ma drugiego słownika nazw do utrzymania.
 */
import type { GameLibraryFilter, GameSearchFilter } from '@/api/games'
import type { SearchTargetType } from '@/api/types'

/**
 * Filtry obsługiwane dziś przez UI. `publisherId` celowo poza listą: wybór
 * wydawcy wymaga podpowiedzi z `/suggest` (Combobox, GH-49), a pełna lista
 * wydawców jest po stronie backendu @Deprecated i ucięta do 200 pozycji.
 */
const FILTER_KEYS = [
  'categoryId',
  'mechanicId',
  'players',
  'maxPlayingTime',
  'yearPublished',
  'age',
] as const

export type GameFilterKey = (typeof FILTER_KEYS)[number]

/** Wartości filtrów to zawsze dodatnie liczby całkowite; śmieci w URL-u ignorujemy. */
function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === '') return undefined
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) return undefined
  return value
}

export function parseGameFilters(params: URLSearchParams): GameLibraryFilter {
  const filters: GameLibraryFilter = {}
  for (const key of FILTER_KEYS) {
    const value = parsePositiveInt(params.get(key))
    if (value !== undefined) filters[key] = value
  }
  return filters
}

/** Numer strony (0-based). Brak parametru, zero lub śmieci = pierwsza strona. */
export function parsePageParam(params: URLSearchParams): number {
  const raw = params.get('page')
  if (raw === null) return 0
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : 0
}

/** Adres wynikowy: puste filtry i pierwsza strona nie zaśmiecają query stringa. */
export function gameFiltersToParams(filters: GameLibraryFilter, page = 0): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value !== undefined) params.set(key, String(value))
  }
  if (page > 0) params.set('page', String(page))
  return params
}

// --- Wyszukiwarka ---------------------------------------------------------

/** Wartości `targetType` akceptowane przez API; cokolwiek innego znaczy „wszystko". */
const TARGET_TYPES: SearchTargetType[] = ['GAME', 'EXPANSION']

/**
 * Filtry wyszukiwarki = filtry biblioteki + fraza i pola, których biblioteka nie ma.
 * `authorId` i `baseGameId` nie mają jeszcze własnych kontrolek (wymagają
 * podpowiedzi z `/suggest` — Combobox, GH-49/GH-50), ale są czytane z adresu,
 * żeby linki typu „więcej tego autora" działały od razu, gdy powstaną.
 */
export function parseSearchFilters(params: URLSearchParams): GameSearchFilter {
  const filters: GameSearchFilter = parseGameFilters(params)

  const q = params.get('q')?.trim()
  if (q) filters.q = q

  const targetType = params.get('targetType')
  if (targetType && (TARGET_TYPES as string[]).includes(targetType)) {
    filters.targetType = targetType as SearchTargetType
  }

  const authorId = parsePositiveInt(params.get('authorId'))
  if (authorId !== undefined) filters.authorId = authorId

  const baseGameId = parsePositiveInt(params.get('baseGameId'))
  if (baseGameId !== undefined) filters.baseGameId = baseGameId

  return filters
}

export function searchFiltersToParams(filters: GameSearchFilter, page = 0): URLSearchParams {
  const params = gameFiltersToParams(filters, page)
  if (filters.q) params.set('q', filters.q)
  if (filters.targetType) params.set('targetType', filters.targetType)
  if (filters.authorId !== undefined) params.set('authorId', String(filters.authorId))
  if (filters.baseGameId !== undefined) params.set('baseGameId', String(filters.baseGameId))
  return params
}
