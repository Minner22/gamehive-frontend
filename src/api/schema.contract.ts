/**
 * Strażnik rozjazdu kontraktu: wymusza, by ręczny generyk `Page<T>` był DOKŁADNIE
 * kształtem wygenerowanego `Page*` (oba kierunki). Plik nie jest nigdzie
 * importowany — istnieje tylko po to, by `tsc -b` zerwał build, gdy kontrakt się
 * rozjedzie (np. backend doda/usunie/zwęzi pole strony) i `Page<T>` wymaga aktualizacji.
 */
import type { components } from './schema'
import type {
  PageAuditLogResponseDto,
  PageAuthorDto,
  PageExpansionCollectionItemDto,
  PageGameCollectionItemDto,
  PageGameDto,
  PageGameExpansionDto,
  PageGameExpansionModerationDto,
  PageGameModerationDto,
  PagePublisherDto,
  PageSearchResultDto,
  PageUserResponseDto,
} from './types'

type Schemas = components['schemas']

// Ścisła równość typów (oba kierunki).
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type AssertTrue<T extends true> = T

export type PageUserContract = AssertTrue<
  Equals<Schemas['PageUserResponseDto'], PageUserResponseDto>
>
export type PageAuditContract = AssertTrue<
  Equals<Schemas['PageAuditLogResponseDto'], PageAuditLogResponseDto>
>

// --- Moduł gier ----------------------------------------------------------

export type PageGameContract = AssertTrue<Equals<Schemas['PageGameDto'], PageGameDto>>
export type PageGameModerationContract = AssertTrue<
  Equals<Schemas['PageGameModerationDto'], PageGameModerationDto>
>
export type PageGameExpansionContract = AssertTrue<
  Equals<Schemas['PageGameExpansionDto'], PageGameExpansionDto>
>
export type PageGameExpansionModerationContract = AssertTrue<
  Equals<Schemas['PageGameExpansionModerationDto'], PageGameExpansionModerationDto>
>
export type PageGameCollectionItemContract = AssertTrue<
  Equals<Schemas['PageGameCollectionItemDto'], PageGameCollectionItemDto>
>
export type PageExpansionCollectionItemContract = AssertTrue<
  Equals<Schemas['PageExpansionCollectionItemDto'], PageExpansionCollectionItemDto>
>
export type PageSearchResultContract = AssertTrue<
  Equals<Schemas['PageSearchResultDto'], PageSearchResultDto>
>
export type PagePublisherContract = AssertTrue<
  Equals<Schemas['PagePublisherDto'], PagePublisherDto>
>
export type PageAuthorContract = AssertTrue<Equals<Schemas['PageAuthorDto'], PageAuthorDto>>
