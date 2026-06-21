import apiClient from './client'
import type { PageUserResponseDto, PageableRequest, UserResponseDto } from './types'

/** Stronicowana lista użytkowników (panel admina). */
export async function listUsers({
  page = 0,
  size = 20,
  sort,
}: PageableRequest = {}): Promise<PageUserResponseDto> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  // Spring oczekuje powtórzonego `sort` (np. sort=username,asc) — nie tablicy[].
  for (const s of sort ?? []) params.append('sort', s)
  // Uwaga: endpoint listy ma końcowy slash.
  const { data } = await apiClient.get<PageUserResponseDto>(
    `/api/v1/admin/users/?${params.toString()}`,
  )
  return data
}

/** Lista nie ma filtra — wyszukiwanie to lookup pojedynczego użytkownika. */
export async function getUserById(id: string): Promise<UserResponseDto> {
  const { data } = await apiClient.get<UserResponseDto>(`/api/v1/admin/users/${id}`)
  return data
}

export async function getUserByUsername(username: string): Promise<UserResponseDto> {
  const { data } = await apiClient.get<UserResponseDto>(
    `/api/v1/admin/users/by-username/${encodeURIComponent(username)}`,
  )
  return data
}

export async function getUserByEmail(email: string): Promise<UserResponseDto> {
  const { data } = await apiClient.get<UserResponseDto>(
    `/api/v1/admin/users/by-email/${encodeURIComponent(email)}`,
  )
  return data
}
