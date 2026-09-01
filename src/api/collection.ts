/**
 * Prywatna kolekcja użytkownika („The Vault").
 *
 * Tożsamość bierze się wyłącznie z tokenu — żaden endpoint nie przyjmuje
 * `userId`. Żądania dodania nie mają body: `ownershipStatus` ma w MVP jedną
 * wartość (OWNED), więc nie ma czego wysyłać. Do kolekcji wchodzą tylko cele
 * APPROVED (inaczej 409 GAME_NOT_APPROVED / EXPANSION_NOT_APPROVED), a duplikat
 * daje 409 ALREADY_IN_COLLECTION.
 */
import apiClient from './client'
import { pageParams } from './params'
import type {
  ExpansionCollectionItemDto,
  GameCollectionItemDto,
  PageExpansionCollectionItemDto,
  PageGameCollectionItemDto,
  PageableRequest,
} from './types'

/** Pozycje niosą pełne `GameDto`, więc lista nie wymaga dociągania celów. */
export async function listCollectionGames(
  pageable: PageableRequest = {},
): Promise<PageGameCollectionItemDto> {
  const { data } = await apiClient.get<PageGameCollectionItemDto>(
    `/api/v1/collection/games?${pageParams(pageable)}`,
  )
  return data
}

export async function addGameToCollection(gameId: number): Promise<GameCollectionItemDto> {
  const { data } = await apiClient.post<GameCollectionItemDto>(
    `/api/v1/collection/games/${gameId}`,
  )
  return data
}

export async function removeGameFromCollection(gameId: number): Promise<void> {
  await apiClient.delete(`/api/v1/collection/games/${gameId}`)
}

export async function listCollectionExpansions(
  pageable: PageableRequest = {},
): Promise<PageExpansionCollectionItemDto> {
  const { data } = await apiClient.get<PageExpansionCollectionItemDto>(
    `/api/v1/collection/expansions?${pageParams(pageable)}`,
  )
  return data
}

/** Dodatek dodaje się niezależnie od tego, czy gra bazowa jest w kolekcji. */
export async function addExpansionToCollection(
  expansionId: number,
): Promise<ExpansionCollectionItemDto> {
  const { data } = await apiClient.post<ExpansionCollectionItemDto>(
    `/api/v1/collection/expansions/${expansionId}`,
  )
  return data
}

export async function removeExpansionFromCollection(expansionId: number): Promise<void> {
  await apiClient.delete(`/api/v1/collection/expansions/${expansionId}`)
}
