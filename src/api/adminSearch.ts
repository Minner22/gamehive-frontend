/**
 * Administracja wyszukiwarką (rola MODERATOR lub ADMIN).
 *
 * Reindeks przebudowuje oba indeksy (treści i podpowiedzi taksonomii) pod jedną
 * blokadą: równoległe uruchomienie zwraca 409 REINDEX_ALREADY_RUNNING. W trakcie
 * przebudowy indeks jest chwilowo pusty, więc wyszukiwarka może nie zwracać
 * wyników — to operacja naprawcza, nie rutynowa.
 */
import apiClient from './client'
import type { ReindexResultDto } from './types'

export async function reindexSearch(): Promise<ReindexResultDto> {
  const { data } = await apiClient.post<ReindexResultDto>('/api/v1/admin/search/reindex')
  return data
}
