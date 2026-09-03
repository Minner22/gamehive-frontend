/**
 * Typy DTO odwzorowujące kontrakt REST GameHive API (OpenAPI 3.1).
 *
 * Źródło prawdy: `./schema.d.ts` (generowane `npm run gen:api` z /v3/api-docs).
 * NIE edytuj `schema.d.ts` ręcznie. Tu trzymamy wygodne aliasy oraz to, czego
 * OpenAPI nie wyraża: generyk `Page<T>` (Spring Data) i unię `Role`.
 */
import type { components, paths } from './schema'

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

// --- Taksonomia (słowniki) -----------------------------------------------

export type PublisherDto = Schemas['PublisherDto']
export type AuthorDto = Schemas['AuthorDto']
export type CategoryDto = Schemas['CategoryDto']
export type MechanicDto = Schemas['MechanicDto']
export type AuthorRequestDto = Schemas['AuthorRequestDto']
export type TaxonomyItemRequestDto = Schemas['TaxonomyItemRequestDto']

/**
 * Status wpisu słownika. Wydawcy i autorzy zgłoszeni „w locie" przy zgłoszeniu
 * gry powstają jako PENDING i są zatwierdzani kaskadowo razem z grą.
 */
export type TaxonomyStatus = NonNullable<PublisherDto['status']>

// --- Gry i dodatki -------------------------------------------------------

export type GameDto = Schemas['GameDto']
export type GameRequestDto = Schemas['GameRequestDto']
export type GameExpansionDto = Schemas['GameExpansionDto']
export type GameExpansionRequestDto = Schemas['GameExpansionRequestDto']

/** Widok moderatora — dokłada submittedBy/reviewedBy/reviewedAt/resubmissionCount. */
export type GameModerationDto = Schemas['GameModerationDto']
export type GameExpansionModerationDto = Schemas['GameExpansionModerationDto']
export type RejectContentRequestDto = Schemas['RejectContentRequestDto']

/** Status w przepływie moderacji: biblioteka to wyłącznie APPROVED. */
export type ModerationStatus = GameDto['moderationStatus']

/**
 * Statusy, po których wolno filtrować kolejkę moderacji. Backend odrzuca
 * pozostałe (400): APPROVED znajduje się przez bibliotekę, a DRAFT jest
 * prywatnym szkicem autora.
 */
export type ModerationQueueStatus = NonNullable<
  NonNullable<paths['/api/v1/moderation/games']['get']['parameters']['query']>['status']
>

// --- Kolekcja („The Vault") ----------------------------------------------

export type GameCollectionItemDto = Schemas['GameCollectionItemDto']
export type ExpansionCollectionItemDto = Schemas['ExpansionCollectionItemDto']

/** W MVP jedyna wartość to OWNED (enum istnieje pod przyszłe WISHLIST/PLAYED). */
export type OwnershipStatus = GameCollectionItemDto['ownershipStatus']

// --- Wyszukiwanie --------------------------------------------------------

/** Wynik wyszukiwarki: dokładnie jedno z pól `game`/`expansion` jest wypełnione. */
export type SearchResultDto = Schemas['SearchResultDto']
export type SearchTargetType = NonNullable<SearchResultDto['targetType']>
export type ReindexResultDto = Schemas['ReindexResultDto']

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
export type PageGameDto = Page<GameDto>
export type PageGameModerationDto = Page<GameModerationDto>
export type PageGameExpansionDto = Page<GameExpansionDto>
export type PageGameExpansionModerationDto = Page<GameExpansionModerationDto>
export type PageGameCollectionItemDto = Page<GameCollectionItemDto>
export type PageExpansionCollectionItemDto = Page<ExpansionCollectionItemDto>
export type PageSearchResultDto = Page<SearchResultDto>
export type PagePublisherDto = Page<PublisherDto>
export type PageAuthorDto = Page<AuthorDto>
// Strażnik rozjazdu Page<T> ↔ wygenerowany Page*: patrz ./schema.contract.ts
