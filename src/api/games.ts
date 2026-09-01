import apiClient from './client'
import { pageParams, setIfPresent } from './params'
import type {
  GameDto,
  GameRequestDto,
  PageGameDto,
  PageSearchResultDto,
  PageableRequest,
  SearchTargetType,
} from './types'

/** Filtry globalnej biblioteki (`GET /games`) — wszystkie opcjonalne. */
export interface GameLibraryFilter {
  publisherId?: number
  categoryId?: number
  mechanicId?: number
  /** Dopasowanie „gra obsługuje N graczy": minPlayers ≤ N ≤ maxPlayers. */
  players?: number
  /** Górna granica czasu gry (≤). */
  maxPlayingTime?: number
  yearPublished?: number
  /** Wiek gracza: minAge ≤ N. */
  age?: number
}

/** Filtry wyszukiwarki pełnotekstowej — biblioteka + pola dostępne tylko w indeksie. */
export interface GameSearchFilter extends GameLibraryFilter {
  q?: string
  targetType?: SearchTargetType
  authorId?: number
  baseGameId?: number
}

/**
 * Backend deklaruje `submit` jako prymitywny `boolean`, więc pominięcie pola
 * kończy się 400 VALIDATION_ERROR — także na PUT, który jego wartość ignoruje.
 * Pole dokładamy tutaj, żeby żadna strona nie mogła o nim zapomnieć.
 */
type GameRequestPayload = GameRequestDto & { submit: boolean }

/** Górny limit strony wyszukiwarki (backend i tak przycina do 50). */
const SEARCH_MAX_PAGE_SIZE = 50

function applyLibraryFilter(params: URLSearchParams, filter: GameLibraryFilter): void {
  setIfPresent(params, 'publisherId', filter.publisherId)
  setIfPresent(params, 'categoryId', filter.categoryId)
  setIfPresent(params, 'mechanicId', filter.mechanicId)
  setIfPresent(params, 'players', filter.players)
  setIfPresent(params, 'maxPlayingTime', filter.maxPlayingTime)
  setIfPresent(params, 'yearPublished', filter.yearPublished)
  setIfPresent(params, 'age', filter.age)
}

/** Globalna biblioteka — wyłącznie pozycje APPROVED. */
export async function listGames(
  filter: GameLibraryFilter = {},
  pageable: PageableRequest = {},
): Promise<PageGameDto> {
  const params = pageParams(pageable)
  applyLibraryFilter(params, filter)
  const { data } = await apiClient.get<PageGameDto>(`/api/v1/games?${params.toString()}`)
  return data
}

/**
 * Pojedyncza gra. Endpoint jest ujednolicony: zwraca pozycję APPROVED albo
 * własne zgłoszenie w dowolnym statusie; cudze zgłoszenie daje to samo 404
 * GAME_NOT_FOUND co nieistniejące id (ochrona przed enumeracją).
 */
export async function getGame(id: number): Promise<GameDto> {
  const { data } = await apiClient.get<GameDto>(`/api/v1/games/${id}`)
  return data
}

/** Własne zgłoszenia: DRAFT / PENDING / REJECTED (zatwierdzone są w bibliotece). */
export async function listMyGames(pageable: PageableRequest = {}): Promise<PageGameDto> {
  const { data } = await apiClient.get<PageGameDto>(`/api/v1/games/my?${pageParams(pageable)}`)
  return data
}

/** `submit: true` tworzy zgłoszenie od razu jako PENDING, `false` zostawia DRAFT. */
export async function createGame(dto: GameRequestDto, submit: boolean): Promise<GameDto> {
  const payload: GameRequestPayload = { ...dto, submit }
  const { data } = await apiClient.post<GameDto>('/api/v1/games', payload)
  return data
}

/** Edycja własnego zgłoszenia (DRAFT/REJECTED). Wartość `submit` jest ignorowana. */
export async function updateGame(id: number, dto: GameRequestDto): Promise<GameDto> {
  const payload: GameRequestPayload = { ...dto, submit: false }
  const { data } = await apiClient.put<GameDto>(`/api/v1/games/${id}`, payload)
  return data
}

/** DRAFT/REJECTED → PENDING. Po wyczerpaniu limitu poprawek: 409. */
export async function submitGame(id: number): Promise<GameDto> {
  const { data } = await apiClient.post<GameDto>(`/api/v1/games/${id}/submit`)
  return data
}

/**
 * Wyszukiwarka pełnotekstowa (gry i dodatki, tylko APPROVED).
 *
 * Kolejność to ranking trafności, więc `sort` **nie jest wysyłany** (backend go
 * ignoruje), a rozmiar strony przycinamy do 50 — tak jak robi to serwer.
 */
export async function searchGames(
  filter: GameSearchFilter = {},
  { page = 0, size = 20 }: PageableRequest = {},
): Promise<PageSearchResultDto> {
  const params = pageParams({ page, size: Math.min(size, SEARCH_MAX_PAGE_SIZE) })
  setIfPresent(params, 'q', filter.q)
  setIfPresent(params, 'targetType', filter.targetType)
  setIfPresent(params, 'authorId', filter.authorId)
  setIfPresent(params, 'baseGameId', filter.baseGameId)
  applyLibraryFilter(params, filter)
  const { data } = await apiClient.get<PageSearchResultDto>(
    `/api/v1/games/search?${params.toString()}`,
  )
  return data
}
