/**
 * Panel moderatora (`/api/v1/moderation/**`, rola MODERATOR lub ADMIN).
 *
 * Kolejki zwracają `*ModerationDto` — te same dane co widok użytkownika plus
 * pola moderacyjne (`submittedBy`, `reviewedBy`, `reviewedAt`, `resubmissionCount`).
 * Kody błędów gier i dodatków są rozdzielone (`GAME_NOT_PENDING` kontra
 * `EXPANSION_NOT_PENDING`), żeby komunikat nigdy nie mówił „gra" o dodatku.
 */
import apiClient from './client'
import { pageParams } from './params'
import type {
  GameExpansionModerationDto,
  GameExpansionRequestDto,
  GameModerationDto,
  GameRequestDto,
  ModerationQueueStatus,
  PageGameExpansionModerationDto,
  PageGameModerationDto,
  PageableRequest,
  RejectContentRequestDto,
} from './types'

/** Patrz `games.ts`: `submit` musi być obecne w każdym body żądania treści. */
type GameRequestPayload = GameRequestDto & { submit: boolean }
type ExpansionRequestPayload = GameExpansionRequestDto & { submit: boolean }

// --- Gry -----------------------------------------------------------------

/**
 * Kolejka zgłoszeń. Domyślnie PENDING; `REJECTED` pokazuje zgłoszenia odrzucone —
 * bez tego filtra nie dałoby się ich odnaleźć, a `unlock` byłby nieosiągalny
 * (backend GH-138). APPROVED i DRAFT są odrzucane przez walidację.
 */
export async function listModerationGames(
  status: ModerationQueueStatus = 'PENDING',
  pageable: PageableRequest = {},
): Promise<PageGameModerationDto> {
  const params = pageParams(pageable)
  params.set('status', status)
  const { data } = await apiClient.get<PageGameModerationDto>(
    `/api/v1/moderation/games?${params.toString()}`,
  )
  return data
}

/** PENDING → APPROVED; kaskadowo zatwierdza oczekujących wydawców i autorów gry. */
export async function approveGame(id: number): Promise<GameModerationDto> {
  const { data } = await apiClient.post<GameModerationDto>(
    `/api/v1/moderation/games/${id}/approve`,
  )
  return data
}

/** Powód jest wymagany — pusty daje 400 REJECTION_REASON_REQUIRED. */
export async function rejectGame(
  id: number,
  dto: RejectContentRequestDto,
): Promise<GameModerationDto> {
  const { data } = await apiClient.post<GameModerationDto>(
    `/api/v1/moderation/games/${id}/reject`,
    dto,
  )
  return data
}

/** REJECTED → DRAFT, zeruje licznik poprawek (override limitu ponownych wysyłek). */
export async function unlockGame(id: number): Promise<GameModerationDto> {
  const { data } = await apiClient.post<GameModerationDto>(`/api/v1/moderation/games/${id}/unlock`)
  return data
}

/** Edycja pozycji z biblioteki — wyłącznie APPROVED (inaczej 409 GAME_NOT_APPROVED). */
export async function updateApprovedGame(
  id: number,
  dto: GameRequestDto,
): Promise<GameModerationDto> {
  const payload: GameRequestPayload = { ...dto, submit: false }
  const { data } = await apiClient.put<GameModerationDto>(`/api/v1/moderation/games/${id}`, payload)
  return data
}

/**
 * Twarde usunięcie (każdy status poza DRAFT). Kasuje też powiązane wpisy
 * w kolekcjach; gra mająca dodatki jest chroniona przez 409 GAME_HAS_EXPANSIONS.
 */
export async function deleteGame(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/moderation/games/${id}`)
}

// --- Dodatki -------------------------------------------------------------

export async function listModerationExpansions(
  status: ModerationQueueStatus = 'PENDING',
  pageable: PageableRequest = {},
): Promise<PageGameExpansionModerationDto> {
  const params = pageParams(pageable)
  params.set('status', status)
  const { data } = await apiClient.get<PageGameExpansionModerationDto>(
    `/api/v1/moderation/expansions?${params.toString()}`,
  )
  return data
}

/** Bez kaskady taksonomii — dodatek nie ma własnych wydawców ani autorów. */
export async function approveExpansion(id: number): Promise<GameExpansionModerationDto> {
  const { data } = await apiClient.post<GameExpansionModerationDto>(
    `/api/v1/moderation/expansions/${id}/approve`,
  )
  return data
}

export async function rejectExpansion(
  id: number,
  dto: RejectContentRequestDto,
): Promise<GameExpansionModerationDto> {
  const { data } = await apiClient.post<GameExpansionModerationDto>(
    `/api/v1/moderation/expansions/${id}/reject`,
    dto,
  )
  return data
}

export async function unlockExpansion(id: number): Promise<GameExpansionModerationDto> {
  const { data } = await apiClient.post<GameExpansionModerationDto>(
    `/api/v1/moderation/expansions/${id}/unlock`,
  )
  return data
}

export async function updateApprovedExpansion(
  id: number,
  dto: GameExpansionRequestDto,
): Promise<GameExpansionModerationDto> {
  const payload: ExpansionRequestPayload = { ...dto, submit: false }
  const { data } = await apiClient.put<GameExpansionModerationDto>(
    `/api/v1/moderation/expansions/${id}`,
    payload,
  )
  return data
}

export async function deleteExpansion(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/moderation/expansions/${id}`)
}
