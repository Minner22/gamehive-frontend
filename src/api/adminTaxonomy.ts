/**
 * Administracja słownikami (`/api/v1/admin/taxonomy/**`, rola ADMIN).
 *
 * Dwie rodziny o różnych kontraktach:
 * - kategorie i mechaniki są kuratorowane → pełne listy, pełny CRUD,
 * - wydawcy i autorzy rosną ze zgłoszeniami użytkowników → listy stronicowane
 *   z filtrem `status` i frazą `q`, plus akcja zatwierdzenia wpisu PENDING.
 *
 * Usunięcie pozycji używanej przez grę lub dodatek zwraca 409 (`*_IN_USE`).
 */
import apiClient from './client'
import { pageParams, setIfPresent } from './params'
import type {
  AuthorDto,
  AuthorRequestDto,
  CategoryDto,
  MechanicDto,
  PageAuthorDto,
  PagePublisherDto,
  PageableRequest,
  PublisherDto,
  TaxonomyItemRequestDto,
  TaxonomyStatus,
} from './types'

/** Filtr list rosnących: status wpisu i fragment nazwy. */
export interface TaxonomyFilter {
  status?: TaxonomyStatus
  q?: string
}

// --- Kategorie (kuratorowane) --------------------------------------------

export async function listCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<CategoryDto[]>('/api/v1/admin/taxonomy/categories')
  return data
}

export async function createCategory(dto: TaxonomyItemRequestDto): Promise<CategoryDto> {
  const { data } = await apiClient.post<CategoryDto>('/api/v1/admin/taxonomy/categories', dto)
  return data
}

export async function renameCategory(
  id: number,
  dto: TaxonomyItemRequestDto,
): Promise<CategoryDto> {
  const { data } = await apiClient.put<CategoryDto>(`/api/v1/admin/taxonomy/categories/${id}`, dto)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/taxonomy/categories/${id}`)
}

// --- Mechaniki (kuratorowane) --------------------------------------------

export async function listMechanics(): Promise<MechanicDto[]> {
  const { data } = await apiClient.get<MechanicDto[]>('/api/v1/admin/taxonomy/mechanics')
  return data
}

export async function createMechanic(dto: TaxonomyItemRequestDto): Promise<MechanicDto> {
  const { data } = await apiClient.post<MechanicDto>('/api/v1/admin/taxonomy/mechanics', dto)
  return data
}

export async function renameMechanic(
  id: number,
  dto: TaxonomyItemRequestDto,
): Promise<MechanicDto> {
  const { data } = await apiClient.put<MechanicDto>(`/api/v1/admin/taxonomy/mechanics/${id}`, dto)
  return data
}

export async function deleteMechanic(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/taxonomy/mechanics/${id}`)
}

// --- Wydawcy (rosnące) ---------------------------------------------------

function taxonomyParams(filter: TaxonomyFilter, pageable: PageableRequest): string {
  const params = pageParams(pageable)
  setIfPresent(params, 'status', filter.status)
  setIfPresent(params, 'q', filter.q)
  return params.toString()
}

export async function listPublishers(
  filter: TaxonomyFilter = {},
  pageable: PageableRequest = {},
): Promise<PagePublisherDto> {
  const { data } = await apiClient.get<PagePublisherDto>(
    `/api/v1/admin/taxonomy/publishers?${taxonomyParams(filter, pageable)}`,
  )
  return data
}

export async function createPublisher(dto: TaxonomyItemRequestDto): Promise<PublisherDto> {
  const { data } = await apiClient.post<PublisherDto>('/api/v1/admin/taxonomy/publishers', dto)
  return data
}

/** Idempotentne — zatwierdzenie już zatwierdzonego wpisu nie jest błędem. */
export async function approvePublisher(id: number): Promise<PublisherDto> {
  const { data } = await apiClient.post<PublisherDto>(
    `/api/v1/admin/taxonomy/publishers/${id}/approve`,
  )
  return data
}

export async function deletePublisher(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/taxonomy/publishers/${id}`)
}

// --- Autorzy (rosnące) ---------------------------------------------------

export async function listAuthors(
  filter: TaxonomyFilter = {},
  pageable: PageableRequest = {},
): Promise<PageAuthorDto> {
  const { data } = await apiClient.get<PageAuthorDto>(
    `/api/v1/admin/taxonomy/authors?${taxonomyParams(filter, pageable)}`,
  )
  return data
}

export async function createAuthor(dto: AuthorRequestDto): Promise<AuthorDto> {
  const { data } = await apiClient.post<AuthorDto>('/api/v1/admin/taxonomy/authors', dto)
  return data
}

export async function updateAuthor(id: number, dto: AuthorRequestDto): Promise<AuthorDto> {
  const { data } = await apiClient.put<AuthorDto>(`/api/v1/admin/taxonomy/authors/${id}`, dto)
  return data
}

export async function approveAuthor(id: number): Promise<AuthorDto> {
  const { data } = await apiClient.post<AuthorDto>(`/api/v1/admin/taxonomy/authors/${id}/approve`)
  return data
}

export async function deleteAuthor(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/taxonomy/authors/${id}`)
}
