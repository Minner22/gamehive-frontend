/**
 * Typy odwzorowujące kontrakt REST GameHive API (OpenAPI 3.1).
 * Utrzymywane ręcznie — przy zmianach w backendzie aktualizować zgodnie
 * ze schematami z /v3/api-docs.
 */

// --- Błędy ---------------------------------------------------------------

export interface ApiError {
  errorCode?: string
  message?: string
}

export interface FieldValidationError {
  field?: string
  message?: string
}

export interface ApiValidationError {
  errorCode?: string
  message?: string
  errors?: FieldValidationError[]
}

// --- Użytkownik / profil -------------------------------------------------

export interface AddressDto {
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

export interface UserProfileResponseDto {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: AddressDto
  dateOfBirth?: string // ISO YYYY-MM-DD
  profilePictureUrl?: string
}

export type Role = 'ROLE_USER' | 'ROLE_ADMIN' | (string & {})

export interface UserResponseDto {
  id: string // UUID
  username: string
  email: string
  enabled: boolean
  roles: Role[]
  profile?: UserProfileResponseDto
}

export interface UserProfileUpdateDto {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: AddressDto
  dateOfBirth?: string // ISO YYYY-MM-DD
  profilePictureUrl?: string
}

export interface UpdateUserRolesDto {
  roles: Role[]
}

// --- Uwierzytelnianie ----------------------------------------------------

export interface RegistrationDto {
  username: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface PasswordResetRequestDto {
  email: string
}

export interface PasswordResetConfirmDto {
  token: string
  newPassword: string
}

export interface ResendActivationEmailDto {
  email: string
}

export interface AccessTokenResponseDto {
  accessToken: string
}

export interface MessageResponseDto {
  message: string
}

// --- Audyt ---------------------------------------------------------------

export type AuditAction =
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'DELETE'
  | 'FORCE_LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ROLE_CHANGE'

export interface AuditLogResponseDto {
  id: number
  action: AuditAction
  targetId: string // UUID
  targetEmail: string
  actor: string
  details?: string
  correlationId: string
  createdAt: string // ISO-8601 date-time (UTC)
}

// --- Stronicowanie (Spring Data Page) ------------------------------------

export interface SortObject {
  empty?: boolean
  sorted?: boolean
  unsorted?: boolean
}

export interface PageableObject {
  offset?: number
  paged?: boolean
  sort?: SortObject
  pageNumber?: number
  pageSize?: number
  unpaged?: boolean
}

/** Parametry zapytania stronicowanego (Spring Pageable). */
export interface PageableRequest {
  page?: number
  size?: number
  sort?: string[]
}

/** Generyczna strona wyników zwracana przez Spring Data. */
export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  sort?: SortObject
  pageable?: PageableObject
}

export type PageUserResponseDto = Page<UserResponseDto>
export type PageAuditLogResponseDto = Page<AuditLogResponseDto>