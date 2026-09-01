import apiClient from './client'
import { pageParams, setIfPresent } from './params'
import type {
  AuditAction,
  PageAuditLogResponseDto,
  PageUserResponseDto,
  PageableRequest,
  UpdateUserRolesDto,
  UserResponseDto,
} from './types'

/** Stronicowana lista użytkowników (panel admina). */
export async function listUsers(pageable: PageableRequest = {}): Promise<PageUserResponseDto> {
  // Uwaga: endpoint listy ma końcowy slash.
  const { data } = await apiClient.get<PageUserResponseDto>(
    `/api/v1/admin/users/?${pageParams(pageable)}`,
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

// --- Dziennik audytu -----------------------------------------------------

export interface AuditLogFilter {
  targetId?: string
  actor?: string
  action?: AuditAction
  from?: string // ISO-8601 UTC, włącznie
  to?: string // ISO-8601 UTC, włącznie
}

export async function listAuditLogs(
  filter: AuditLogFilter = {},
  { page = 0, size = 20, sort = ['createdAt,desc'] }: PageableRequest = {},
): Promise<PageAuditLogResponseDto> {
  const params = pageParams({ page, size, sort })
  setIfPresent(params, 'targetId', filter.targetId)
  setIfPresent(params, 'actor', filter.actor)
  setIfPresent(params, 'action', filter.action)
  setIfPresent(params, 'from', filter.from)
  setIfPresent(params, 'to', filter.to)
  const { data } = await apiClient.get<PageAuditLogResponseDto>(
    `/api/v1/admin/audit?${params.toString()}`,
  )
  return data
}
