/**
 * Fabryki danych testowych dla modułu gier oraz pomocnik MSW do przechwytywania
 * query stringa (warstwa API buduje go ręcznie, więc to on jest tu kontraktem).
 *
 * Kształty odpowiadają DTO backendu — w szczególności dodatek niesie równolegle
 * wartości własne (`null` = dziedziczy) i `effective*` (po dziedziczeniu),
 * bo na tej różnicy stoi cały jego widok.
 */
import { http, HttpResponse } from 'msw'
import { server } from './server'
import { ANY_ORIGIN } from './handlers'
import type {
  GameCollectionItemDto,
  GameDto,
  GameExpansionDto,
  Page,
  SearchResultDto,
} from '@/api/types'

/** Strona Spring Data zbudowana wokół podanej zawartości. */
export function makePage<T>(content: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  const size = overrides.size ?? 20
  return {
    content,
    size,
    number: 0,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : Math.ceil(content.length / size),
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
    ...overrides,
  }
}

export function makeGame(overrides: Partial<GameDto> = {}): GameDto {
  return {
    id: 1,
    title: 'Agricola',
    description: 'Gra o prowadzeniu gospodarstwa.',
    minPlayers: 1,
    maxPlayers: 5,
    playingTimeMinutes: 120,
    yearPublished: 2007,
    minAge: 12,
    coverImageUrl: undefined,
    moderationStatus: 'APPROVED',
    rejectionReason: undefined,
    publishers: [{ id: 1, name: 'Lookout Games', status: 'APPROVED' }],
    categories: [{ id: 1, name: 'Ekonomiczna' }],
    mechanics: [{ id: 1, name: 'Worker placement' }],
    authors: [{ id: 1, firstName: 'Uwe', lastName: 'Rosenberg', status: 'APPROVED' }],
    ...overrides,
  }
}

/**
 * Domyślnie: dodatek nadpisuje `maxPlayers` i dziedziczy resztę — czyli dokładnie
 * przypadek, który UI ma umieć rozróżnić.
 */
export function makeExpansion(overrides: Partial<GameExpansionDto> = {}): GameExpansionDto {
  return {
    id: 1,
    baseGameId: 1,
    baseGameTitle: 'Agricola',
    name: 'Agricola: Rzeka',
    description: 'Dodatek rozszerzający gospodarstwo o rzekę.',
    minPlayers: undefined,
    maxPlayers: 6,
    playingTimeMinutes: undefined,
    minAge: undefined,
    effectiveMinPlayers: 1,
    effectiveMaxPlayers: 6,
    effectivePlayingTimeMinutes: 120,
    effectiveMinAge: 12,
    categories: [],
    mechanics: [],
    effectiveCategories: [{ id: 1, name: 'Ekonomiczna' }],
    effectiveMechanics: [{ id: 1, name: 'Worker placement' }],
    moderationStatus: 'APPROVED',
    rejectionReason: undefined,
    ...overrides,
  }
}

export function makeCollectionItem(
  overrides: Partial<GameCollectionItemDto> = {},
): GameCollectionItemDto {
  return {
    id: 1,
    ownershipStatus: 'OWNED',
    addedAt: '2026-08-01T10:00:00Z',
    game: makeGame(),
    ...overrides,
  }
}

/** Wynik wyszukiwarki — wypełnione jest dokładnie jedno z pól `game`/`expansion`. */
export function makeSearchResult(overrides: Partial<SearchResultDto> = {}): SearchResultDto {
  return {
    targetType: 'GAME',
    game: makeGame(),
    expansion: undefined,
    ...overrides,
  }
}

/**
 * Podstawia handler GET pod wskazaną ścieżkę i zapamiętuje parametry zapytania.
 * Zwrócony obiekt wypełnia się dopiero po wywołaniu funkcji z warstwy API.
 */
export function captureQuery(path: string, body: object) {
  const captured = { params: new URLSearchParams() }
  server.use(
    http.get(`${ANY_ORIGIN}${path}`, ({ request }) => {
      captured.params = new URL(request.url).searchParams
      return HttpResponse.json(body)
    }),
  )
  return captured
}
