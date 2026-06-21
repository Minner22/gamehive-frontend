import apiClient from './client'
import type {
  PageUserResponseDto,
  PageableRequest,
  UpdateUserRolesDto,
  UserResponseDto,
} from './types'

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

// --- Akcje na użytkowniku (odpowiedzi bez body — aktualizujemy stan lokalnie) --

export async function activateUser(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/admin/users/${id}/activate`)
}

export async function deactivateUser(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/admin/users/${id}/deactivate`)
}

export async function forceLogoutUser(id: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/users/${id}/force-logout`)
}

export async function updateUserRoles(id: string, dto: UpdateUserRolesDto): Promise<void> {
  await apiClient.put(`/api/v1/admin/users/${id}/roles`, dto)
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/users/${id}`)
}
