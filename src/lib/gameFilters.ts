/**
 * Filtry biblioteki gier w query stringu — jedno źródło prawdy dla adresu strony.
 *
 * Dzięki temu wynik filtrowania da się wkleić komuś w linku, a przycisk „wstecz"
 * cofa do poprzedniego zestawu filtrów. Klucze są takie same jak parametry API,
 * więc nie ma drugiego słownika nazw do utrzymania.
 */
import type { GameLibraryFilter } from '@/api/games'

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
