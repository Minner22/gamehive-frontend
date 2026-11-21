/**
 * Komunikaty błędów dla użytkownika — po polsku, z `ApiError.errorCode` (#81).
 *
 * Właścicielem tekstów jest front (decyzja w gamehive-backend#149): backendowe
 * `message` to statyczny angielski opis dla programisty i nie trafia do UI.
 * Teksty nie zawierają danych wejściowych — tak jak odpowiedzi backendu.
 *
 * `KnownErrorCode` to kopia `ErrorCode.java` z backendu (OpenAPI typuje `errorCode`
 * jako zwykły string, więc TypeScript nie zauważy nowego kodu sam). Backend dodaje
 * kod → dopisz go tutaj; do tego czasu ratują go wzorce w `errorMessageFor`.
 */

export type KnownErrorCode =
  // Domain — naruszenia reguł biznesowych
  | 'ALREADY_IN_COLLECTION'
  | 'AUTHOR_IN_USE'
  | 'AUTHOR_NAME_EXISTS'
  | 'BASE_GAME_NOT_APPROVED'
  | 'BASE_GAME_REQUIRED'
  | 'CANNOT_MODIFY_OWN_ACCOUNT'
  | 'CANNOT_REMOVE_LAST_ADMIN'
  | 'CATEGORY_IN_USE'
  | 'CATEGORY_NAME_EXISTS'
  | 'CATEGORY_REQUIRED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'EXPANSION_NOT_APPROVED'
  | 'EXPANSION_NOT_EDITABLE'
  | 'EXPANSION_NOT_PENDING'
  | 'EXPANSION_NOT_REJECTED'
  | 'GAME_HAS_EXPANSIONS'
  | 'GAME_NOT_APPROVED'
  | 'GAME_NOT_EDITABLE'
  | 'GAME_NOT_PENDING'
  | 'GAME_NOT_REJECTED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_HASHED_PASSWORD'
  | 'INVALID_PASSWORD'
  | 'INVALID_PHONE_NUMBER'
  | 'INVALID_PLAYER_COUNT'
  | 'INVALID_PROFILE_PICTURE_URL'
  | 'INVALID_USERNAME'
  | 'MECHANIC_IN_USE'
  | 'MECHANIC_NAME_EXISTS'
  | 'PUBLISHER_IN_USE'
  | 'PUBLISHER_NAME_EXISTS'
  | 'PUBLISHER_REQUIRED'
  | 'REJECTION_REASON_REQUIRED'
  | 'RESUBMISSION_LIMIT_EXCEEDED'
  | 'ROLE_ALREADY_ASSIGNED'
  | 'USER_ALREADY_ACTIVATED'
  | 'USERNAME_ALREADY_EXISTS'
  // Application — problemy w przepływie use-case
  | 'ACCOUNT_DISABLED'
  | 'AUTHOR_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'COLLECTION_ITEM_NOT_FOUND'
  | 'EMAIL_NOT_FOUND'
  | 'EXPANSION_NOT_FOUND'
  | 'GAME_NOT_FOUND'
  | 'JWT_BLACKLISTED'
  | 'JWT_EXPIRED'
  | 'JWT_INVALID_ALGORITHM'
  | 'JWT_INVALID_SIGNATURE'
  | 'JWT_INVALID_TYPE'
  | 'JWT_INVALID_JTI'
  | 'JWT_INVALID_SUBJECT'
  | 'JWT_INVALID_ROLES'
  | 'JWT_PARSE_ERROR'
  | 'MECHANIC_NOT_FOUND'
  | 'PUBLISHER_NOT_FOUND'
  | 'REFRESH_TOKEN_MISSING'
  | 'REINDEX_ALREADY_RUNNING'
  | 'ROLE_NOT_FOUND'
  | 'TOKEN_REVOKED'
  | 'USER_NOT_FOUND'
  | 'USER_NOT_ACTIVATED'
  | 'USERNAME_OR_EMAIL_NOT_FOUND'
  // Infrastructure — awarie systemów zewnętrznych
  | 'EMAIL_SEND_FAILED'
  | 'JWT_KEY_ERROR'
  | 'JWT_SIGNING_ERROR'
  | 'REDIS_UNAVAILABLE'
  | 'SEARCH_FAILED'
  | 'SEARCH_INDEX_UNAVAILABLE'
  // Handler-only — GlobalExceptionHandler
  | 'ACCESS_DENIED'
  | 'DATA_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_ACCEPTABLE'
  | 'RESOURCE_NOT_FOUND'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'VALIDATION_ERROR'

/** Ogólny komunikat: nieznany kod albo błąd bez kodu. */
export const GENERIC_ERROR_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.'

/** Brak odpowiedzi serwera (sieć, CORS, serwer wyłączony). */
export const NETWORK_ERROR_MESSAGE = 'Brak połączenia z serwerem.'

const SESSION_EXPIRED = 'Sesja wygasła — zaloguj się ponownie.'
const LINK_INVALID = 'Link jest nieprawidłowy albo wygasł. Poproś o nowy.'
const TECHNICAL = 'Wystąpił błąd po stronie serwera. Spróbuj ponownie za chwilę.'
const OUR_FAULT = 'Wystąpił błąd aplikacji. Odśwież stronę i spróbuj ponownie.'

export const ERROR_MESSAGES = {
  // --- Kolekcja ---
  ALREADY_IN_COLLECTION: 'Masz już to w kolekcji.',
  COLLECTION_ITEM_NOT_FOUND: 'Tej pozycji nie ma już w Twojej kolekcji.',

  // --- Słowniki taksonomii ---
  AUTHOR_IN_USE: 'Pozycja jest używana przez grę lub dodatek — najpierw odepnij ją od treści.',
  CATEGORY_IN_USE: 'Pozycja jest używana przez grę lub dodatek — najpierw odepnij ją od treści.',
  MECHANIC_IN_USE: 'Pozycja jest używana przez grę lub dodatek — najpierw odepnij ją od treści.',
  PUBLISHER_IN_USE: 'Pozycja jest używana przez grę lub dodatek — najpierw odepnij ją od treści.',
  AUTHOR_NAME_EXISTS: 'Taka pozycja już jest w słowniku.',
  CATEGORY_NAME_EXISTS: 'Taka pozycja już jest w słowniku.',
  MECHANIC_NAME_EXISTS: 'Taka pozycja już jest w słowniku.',
  PUBLISHER_NAME_EXISTS: 'Taka pozycja już jest w słowniku.',
  AUTHOR_NOT_FOUND: 'Nie znaleziono autora — mógł zostać usunięty.',
  CATEGORY_NOT_FOUND: 'Nie znaleziono kategorii — mogła zostać usunięta.',
  MECHANIC_NOT_FOUND: 'Nie znaleziono mechaniki — mogła zostać usunięta.',
  PUBLISHER_NOT_FOUND: 'Nie znaleziono wydawcy — mógł zostać usunięty.',

  // --- Gry i dodatki: zgłoszenia ---
  BASE_GAME_REQUIRED: 'Wybierz grę bazową dodatku.',
  BASE_GAME_NOT_APPROVED: 'Gra bazowa musi być zatwierdzona w bibliotece.',
  CATEGORY_REQUIRED: 'Wybierz co najmniej jedną kategorię.',
  PUBLISHER_REQUIRED: 'Wybierz co najmniej jednego wydawcę.',
  INVALID_PLAYER_COUNT: 'Minimalna liczba graczy nie może być większa niż maksymalna.',
  GAME_NOT_EDITABLE: 'Zgłoszenie jest w moderacji — nie można go teraz edytować.',
  EXPANSION_NOT_EDITABLE: 'Zgłoszenie jest w moderacji — nie można go teraz edytować.',
  RESUBMISSION_LIMIT_EXCEEDED: 'Wykorzystano limit ponownych zgłoszeń — skontaktuj się z moderatorem.',
  GAME_NOT_FOUND: 'Nie znaleziono gry — mogła zostać usunięta.',
  EXPANSION_NOT_FOUND: 'Nie znaleziono dodatku — mógł zostać usunięty.',

  // --- Gry i dodatki: biblioteka i moderacja ---
  GAME_NOT_APPROVED: 'Ta gra nie jest jeszcze zatwierdzona w bibliotece.',
  EXPANSION_NOT_APPROVED: 'Ten dodatek nie jest jeszcze zatwierdzony w bibliotece.',
  GAME_NOT_PENDING: 'Ktoś już podjął decyzję w tym zgłoszeniu — odśwież listę.',
  EXPANSION_NOT_PENDING: 'Ktoś już podjął decyzję w tym zgłoszeniu — odśwież listę.',
  GAME_NOT_REJECTED: 'Zgłoszenie nie jest odrzucone — odśwież listę.',
  EXPANSION_NOT_REJECTED: 'Zgłoszenie nie jest odrzucone — odśwież listę.',
  REJECTION_REASON_REQUIRED: 'Podaj powód odrzucenia.',
  GAME_HAS_EXPANSIONS: 'Nie można usunąć gry, do której są dodatki — najpierw usuń dodatki.',

  // --- Wyszukiwarka ---
  REINDEX_ALREADY_RUNNING: 'Przebudowa już trwa — poczekaj, aż się skończy.',
  SEARCH_INDEX_UNAVAILABLE: 'Wyszukiwarka jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
  SEARCH_FAILED: 'Wyszukiwanie nie powiodło się. Spróbuj ponownie.',

  // --- Konto, logowanie, rejestracja ---
  INVALID_CREDENTIALS: 'Nieprawidłowy e-mail lub hasło.',
  INVALID_PASSWORD: 'Nieprawidłowe hasło.',
  USER_NOT_ACTIVATED: 'Konto nie jest jeszcze aktywne — sprawdź skrzynkę i kliknij link aktywacyjny.',
  USER_ALREADY_ACTIVATED: 'Konto jest już aktywne — możesz się zalogować.',
  ACCOUNT_DISABLED: 'Konto zostało zablokowane. Skontaktuj się z administratorem.',
  EMAIL_ALREADY_EXISTS: 'Konto z tym adresem e-mail już istnieje.',
  USERNAME_ALREADY_EXISTS: 'Ta nazwa użytkownika jest już zajęta.',
  EMAIL_NOT_FOUND: 'Nie znaleziono konta z tym adresem e-mail.',
  USERNAME_OR_EMAIL_NOT_FOUND: 'Nie znaleziono takiego konta.',
  INVALID_EMAIL_FORMAT: 'Podaj poprawny adres e-mail.',
  INVALID_USERNAME: 'Nazwa użytkownika ma niedozwolony format.',
  INVALID_PHONE_NUMBER: 'Podaj numer telefonu w formacie międzynarodowym, np. +48123456789.',
  INVALID_PROFILE_PICTURE_URL: 'Podaj poprawny adres URL zdjęcia profilowego.',
  INVALID_HASHED_PASSWORD: TECHNICAL,
  EMAIL_SEND_FAILED: 'Nie udało się wysłać wiadomości e-mail. Spróbuj ponownie za chwilę.',

  // --- Panel admina ---
  CANNOT_MODIFY_OWN_ACCOUNT: 'Nie możesz wykonać tej operacji na własnym koncie.',
  CANNOT_REMOVE_LAST_ADMIN: 'Nie można odebrać uprawnień ostatniemu administratorowi.',
  ROLE_ALREADY_ASSIGNED: 'Użytkownik ma już tę rolę.',
  ROLE_NOT_FOUND: 'Nie znaleziono takiej roli.',
  USER_NOT_FOUND: 'Nie znaleziono użytkownika — mógł zostać usunięty.',

  // --- Sesja i tokeny (przekierowanie obsługuje warstwa auth; tu tylko tekst) ---
  JWT_EXPIRED: SESSION_EXPIRED,
  JWT_BLACKLISTED: LINK_INVALID,
  JWT_INVALID_ALGORITHM: SESSION_EXPIRED,
  JWT_INVALID_SIGNATURE: SESSION_EXPIRED,
  JWT_INVALID_TYPE: SESSION_EXPIRED,
  JWT_INVALID_JTI: SESSION_EXPIRED,
  JWT_INVALID_SUBJECT: SESSION_EXPIRED,
  JWT_INVALID_ROLES: SESSION_EXPIRED,
  JWT_PARSE_ERROR: LINK_INVALID,
  REFRESH_TOKEN_MISSING: SESSION_EXPIRED,
  TOKEN_REVOKED: SESSION_EXPIRED,
  ACCESS_DENIED: 'Nie masz uprawnień do tej operacji.',

  // --- Techniczne ---
  JWT_KEY_ERROR: TECHNICAL,
  JWT_SIGNING_ERROR: TECHNICAL,
  REDIS_UNAVAILABLE: 'Usługa logowania jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
  INTERNAL_ERROR: TECHNICAL,
  DATA_CONFLICT: 'Ktoś zmienił te dane w międzyczasie. Odśwież stronę i spróbuj ponownie.',
  VALIDATION_ERROR: 'Sprawdź poprawność wypełnionych pól.',
  // Te trzy i RESOURCE_NOT_FOUND to błędy naszego zapytania, nie użytkownika (patrz isDomainNotFound).
  METHOD_NOT_ALLOWED: OUR_FAULT,
  NOT_ACCEPTABLE: OUR_FAULT,
  UNSUPPORTED_MEDIA_TYPE: OUR_FAULT,
  RESOURCE_NOT_FOUND: OUR_FAULT,
} satisfies Record<KnownErrorCode, string>

/**
 * Zapas dla kodów, których mapa jeszcze nie zna (backend dodał nowy) — po końcówce
 * albo przedrostku, który ma wspólny sens we wszystkich modułach.
 */
const PATTERNS: { matches: (code: string) => boolean; message: string }[] = [
  { matches: (c) => c.endsWith('_NOT_FOUND'), message: 'Nie znaleziono — pozycja mogła zostać usunięta.' },
  { matches: (c) => c.endsWith('_IN_USE'), message: 'Pozycja jest w użyciu i nie można jej usunąć.' },
  { matches: (c) => c.endsWith('_EXISTS'), message: 'Taka pozycja już istnieje.' },
  { matches: (c) => c.endsWith('_NOT_PENDING'), message: 'Ktoś już podjął decyzję w tym zgłoszeniu — odśwież listę.' },
  { matches: (c) => c.startsWith('JWT_') || c.startsWith('REFRESH_TOKEN_'), message: SESSION_EXPIRED },
]

function isKnownErrorCode(code: string): code is KnownErrorCode {
  return Object.hasOwn(ERROR_MESSAGES, code)
}

/** Polski komunikat dla `errorCode`: mapa → wzorzec → ogólny. */
export function errorMessageFor(code: string | undefined | null): string {
  if (!code) return GENERIC_ERROR_MESSAGE
  if (isKnownErrorCode(code)) return ERROR_MESSAGES[code]
  return PATTERNS.find((pattern) => pattern.matches(code))?.message ?? GENERIC_ERROR_MESSAGE
}
