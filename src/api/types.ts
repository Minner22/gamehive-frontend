/**
 * Typy DTO odwzorowujące kontrakt REST GameHive API (OpenAPI 3.1).
 *
 * Źródło prawdy: `./schema.d.ts` (generowane `npm run gen:api` z /v3/api-docs).
 * NIE edytuj `schema.d.ts` ręcznie. Tu trzymamy wygodne aliasy oraz to, czego
 * OpenAPI nie wyraża: generyk `Page<T>` (Spring Data) i unię `Role`.
 */
import type { components } from './schema'

type Schemas = components['schemas']

// --- Błędy ---------------------------------------------------------------

export type ApiError = Schemas['ApiError']
export type FieldValidationError = Schemas['FieldValidationError']
export type ApiValidationError = Schemas['ApiValidationError']

// --- Użytkownik / profil -------------------------------------------------

export type AddressDto = Schemas['AddressDto']
export type UserProfileResponseDto = Schemas['UserProfileResponseDto']
export type UserResponseDto = Schemas['UserResponseDto']
export type UserProfileUpdateDto = Schemas['UserProfileUpdateDto']
export type UpdateUserRolesDto = Schemas['UpdateUserRolesDto']
export type DeleteAccountDto = Schemas['DeleteAccountDto']

/** Role aplikacji (kontrakt typuje `roles` jako string[]). */
export type Role = 'ROLE_USER' | 'ROLE_MODERATOR' | 'ROLE_ADMIN' | (string & {})

// --- Uwierzytelnianie ----------------------------------------------------

export type RegistrationDto = Schemas['RegistrationDto']
export type LoginDto = Schemas['LoginDto']
export type PasswordResetRequestDto = Schemas['PasswordResetRequestDto']
export type PasswordResetConfirmDto = Schemas['PasswordResetConfirmDto']
export type ResendActivationEmailDto = Schemas['ResendActivationEmailDto']
export type AccessTokenResponseDto = Schemas['AccessTokenResponseDto']
export type MessageResponseDto = Schemas['MessageResponseDto']

// --- Audyt ---------------------------------------------------------------

/** Rodzaj operacji audytu — unia ze schematu. */
export type AuditAction = Schemas['AuditLogResponseDto']['action']
export type AuditLogResponseDto = Schemas['AuditLogResponseDto']

// --- Stronicowanie (Spring Data Page) ------------------------------------

/** Parametry zapytania stronicowanego (Spring Pageable). */
export type PageableRequest = Schemas['Pageable']

/**
 * Generyczna strona Spring Data. OpenAPI materializuje ją per typ
 * (PageUserResponseDto…), ale kształt jest wspólny — tu trzymamy generyk.
 */
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
}

export type PageUserResponseDto = Page<UserResponseDto>
export type PageAuditLogResponseDto = Page<AuditLogResponseDto>
// Strażnik rozjazdu Page<T> ↔ wygenerowany Page*: patrz ./schema.contract.ts
