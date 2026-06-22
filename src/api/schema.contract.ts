/**
 * Strażnik rozjazdu kontraktu: wymusza, by ręczny generyk `Page<T>` był DOKŁADNIE
 * kształtem wygenerowanego `Page*` (oba kierunki). Plik nie jest nigdzie
 * importowany — istnieje tylko po to, by `tsc -b` zerwał build, gdy kontrakt się
 * rozjedzie (np. backend doda/usunie/zwęzi pole strony) i `Page<T>` wymaga aktualizacji.
 */
import type { components } from './schema'
import type { PageAuditLogResponseDto, PageUserResponseDto } from './types'

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
