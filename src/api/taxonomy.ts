/**
 * Słowniki widoczne dla zwykłego użytkownika (formularze zgłoszeń, filtry).
 *
 * Kategorie i mechaniki są kuratorowane i krótkie, więc backend zwraca je jako
 * pełne listy. Wydawcy i autorzy rosną razem ze zgłoszeniami użytkowników —
 * ich pełne listy (`GET /taxonomy/{publishers,authors}`) są po stronie backendu
 * oznaczone jako @Deprecated i ucięte do 200 pozycji, dlatego **świadomie nie ma
 * ich w tym module**: jedynym wejściem są podpowiedzi `/suggest`.
 */
import apiClient from './client'
import { setIfPresent } from './params'
import type { AuthorDto, CategoryDto, MechanicDto, PublisherDto } from './types'

/** Domyślny limit podpowiedzi po stronie backendu (dopuszczalne 1–50). */
const SUGGEST_DEFAULT_LIMIT = 10

export async function listCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<CategoryDto[]>('/api/v1/taxonomy/categories')
  return data
}

export async function listMechanics(): Promise<MechanicDto[]> {
  const { data } = await apiClient.get<MechanicDto[]>('/api/v1/taxonomy/mechanics')
  return data
}

function suggestParams(q: string, limit: number): string {
  const params = new URLSearchParams()
  setIfPresent(params, 'q', q)
  params.set('limit', String(limit))
  return params.toString()
}

/**
 * Podpowiedzi wydawców. Zwracane są wpisy we **wszystkich** statusach — wpis
 * PENDING trzeba w UI oznaczyć jako oczekujący, inaczej użytkownik utworzy
 * duplikat nazwy, która już czeka na zatwierdzenie.
 */
export async function suggestPublishers(
  q: string,
  limit: number = SUGGEST_DEFAULT_LIMIT,
): Promise<PublisherDto[]> {
  const { data } = await apiClient.get<PublisherDto[]>(
    `/api/v1/taxonomy/publishers/suggest?${suggestParams(q, limit)}`,
  )
  return data
}

/** Jak wyżej; dopasowanie obejmuje imię, nazwisko i pełną frazę „Imię Nazwisko". */
export async function suggestAuthors(
  q: string,
  limit: number = SUGGEST_DEFAULT_LIMIT,
): Promise<AuthorDto[]> {
  const { data } = await apiClient.get<AuthorDto[]>(
    `/api/v1/taxonomy/authors/suggest?${suggestParams(q, limit)}`,
  )
  return data
}
