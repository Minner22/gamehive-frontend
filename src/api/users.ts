import apiClient from './client'
import type {
  DeleteAccountDto,
  UserProfileResponseDto,
  UserProfileUpdateDto,
  UserResponseDto,
} from './types'

/** Dane konta i profil zalogowanego użytkownika. */
export async function getMe(): Promise<UserResponseDto> {
  const { data } = await apiClient.get<UserResponseDto>('/api/v1/users/me')
  return data
}

/** Częściowa aktualizacja profilu zalogowanego użytkownika. */
export async function updateProfile(
  dto: UserProfileUpdateDto,
): Promise<UserProfileResponseDto> {
  const { data } = await apiClient.patch<UserProfileResponseDto>(
    '/api/v1/users/me/profile',
    dto,
  )
  return data
}

/** Trwałe usunięcie własnego konta (po potwierdzeniu hasłem). Po 204 backend
 *  unieważnia tokeny i czyści ciasteczko refresh — sesję czyścimy też lokalnie. */
export async function deleteAccount(dto: DeleteAccountDto): Promise<void> {
  await apiClient.delete('/api/v1/users/me', { data: dto })
}
