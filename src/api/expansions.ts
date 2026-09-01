import apiClient from './client'
import { pageParams, setIfPresent } from './params'
import type {
  GameExpansionDto,
  GameExpansionRequestDto,
  PageGameExpansionDto,
  PageableRequest,
} from './types'

/**
 * Filtry biblioteki dodatków. Węższe niż w grach: dodatek nie ma wydawców,
 * autorów ani roku wydania, a filtrowanie po wartościach *efektywnych*
 * (dziedziczonych z gry bazowej) backend świadomie oddał wyszukiwarce.
 */
export interface ExpansionLibraryFilter {
  baseGameId?: number
  categoryId?: number
  mechanicId?: number
}

/** Patrz `games.ts` — `submit` to prymitywny boolean, musi być w każdym body. */
type ExpansionRequestPayload = GameExpansionRequestDto & { submit: boolean }

/** Biblioteka dodatków — wyłącznie pozycje APPROVED. */
export async function listExpansions(
  filter: ExpansionLibraryFilter = {},
  pageable: PageableRequest = {},
): Promise<PageGameExpansionDto> {
  const params = pageParams(pageable)
  setIfPresent(params, 'baseGameId', filter.baseGameId)
  setIfPresent(params, 'categoryId', filter.categoryId)
  setIfPresent(params, 'mechanicId', filter.mechanicId)
  const { data } = await apiClient.get<PageGameExpansionDto>(
    `/api/v1/expansions?${params.toString()}`,
  )
  return data
}

/** APPROVED albo własne zgłoszenie; inaczej 404 EXPANSION_NOT_FOUND. */
export async function getExpansion(id: number): Promise<GameExpansionDto> {
  const { data } = await apiClient.get<GameExpansionDto>(`/api/v1/expansions/${id}`)
  return data
}

export async function listMyExpansions(
  pageable: PageableRequest = {},
): Promise<PageGameExpansionDto> {
  const { data } = await apiClient.get<PageGameExpansionDto>(
    `/api/v1/expansions/my?${pageParams(pageable)}`,
  )
  return data
}

/** Gra bazowa musi być APPROVED, inaczej 409 BASE_GAME_NOT_APPROVED. */
export async function createExpansion(
  dto: GameExpansionRequestDto,
  submit: boolean,
): Promise<GameExpansionDto> {
  const payload: ExpansionRequestPayload = { ...dto, submit }
  const { data } = await apiClient.post<GameExpansionDto>('/api/v1/expansions', payload)
  return data
}

/**
 * Edycja własnego zgłoszenia (DRAFT/REJECTED). `baseGameId` jest po stronie
 * backendu nieedytowalne — PUT go nie czyta, więc nie przenosi dodatku pod
 * inną grę.
 */
export async function updateExpansion(
  id: number,
  dto: GameExpansionRequestDto,
): Promise<GameExpansionDto> {
  const payload: ExpansionRequestPayload = { ...dto, submit: false }
  const { data } = await apiClient.put<GameExpansionDto>(`/api/v1/expansions/${id}`, payload)
  return data
}

export async function submitExpansion(id: number): Promise<GameExpansionDto> {
  const { data } = await apiClient.post<GameExpansionDto>(`/api/v1/expansions/${id}/submit`)
  return data
}
