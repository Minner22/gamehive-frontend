import { z } from 'zod'

/**
 * Schematy walidacji (zod) odwzorowujące ograniczenia kontraktu GameHive API.
 * Trzymać zgodnie z DTO backendu — to pierwsza linia walidacji po stronie klienta
 * (backend i tak waliduje ponownie; błędy serwera mapujemy przez @/lib/apiError).
 */

// Wspólne pola
const email = z.email('Podaj poprawny adres e-mail')

const password = z
  .string()
  .min(8, 'Hasło musi mieć co najmniej 8 znaków')
  .max(2147483647)

const username = z
  .string()
  .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
  .max(30, 'Nazwa użytkownika może mieć maksymalnie 30 znaków')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Dozwolone znaki: litery, cyfry oraz . _ -')

// --- Auth ---------------------------------------------------------------

export const registerSchema = z.object({
  username,
  email,
  password,
})
export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Schemat formularza rejestracji = kontrakt + powtórzenie hasła (pole tylko po
 * stronie klienta, nie wysyłane do API). Sprawdza zgodność obu haseł.
 */
export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(1, 'Powtórz hasło') })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Hasła nie są takie same',
    path: ['confirmPassword'],
  })
export type RegisterFormInput = z.infer<typeof registerFormSchema>

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Podaj hasło'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const passwordResetRequestSchema = z.object({ email })
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Brak tokenu resetu'),
  newPassword: password,
})
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>

/** Formularz ustawienia nowego hasła (token pochodzi z URL, nie z formularza). */
export const passwordResetConfirmFormSchema = z
  .object({
    newPassword: password,
    confirmNewPassword: z.string().min(1, 'Powtórz hasło'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Hasła nie są takie same',
    path: ['confirmNewPassword'],
  })
export type PasswordResetConfirmFormInput = z.infer<typeof passwordResetConfirmFormSchema>

export const resendActivationSchema = z.object({ email })
export type ResendActivationInput = z.infer<typeof resendActivationSchema>

/** Potwierdzenie usunięcia konta hasłem (poprawność weryfikuje backend). */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Podaj hasło, aby potwierdzić'),
})
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>

// --- Profil (PATCH, wszystkie pola opcjonalne) --------------------------
//
// Puste pole formularza ('') zamieniamy na undefined, żeby przy PATCH nie
// nadpisać istniejącej wartości pustym stringiem (pominięte pola = bez zmian).

const emptyToUndefined = (v: string | undefined) => (v ? v : undefined)

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label}: maksymalnie ${max} znaków`)
    .optional()
    .transform(emptyToUndefined)

export const addressSchema = z
  .object({
    street: optionalText(255, 'Ulica'),
    city: optionalText(255, 'Miasto'),
    postalCode: optionalText(20, 'Kod pocztowy'),
    country: optionalText(100, 'Kraj'),
  })
  // Wszystkie podpola puste → cały adres undefined (nie wysyłamy {} przy PATCH,
  // żeby nie nadpisać/wyzerować zapisanego adresu).
  .transform((addr) => (Object.values(addr).some((v) => v !== undefined) ? addr : undefined))

export const profileUpdateSchema = z.object({
  firstName: optionalText(50, 'Imię'),
  lastName: optionalText(50, 'Nazwisko'),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Numer w formacie E.164, np. +48123456789')
    .or(z.literal(''))
    .optional()
    .transform(emptyToUndefined),
  dateOfBirth: z
    .string()
    .refine((v) => new Date(v) < new Date(), 'Data urodzenia musi być w przeszłości')
    .or(z.literal(''))
    .optional()
    .transform(emptyToUndefined),
  profilePictureUrl: z
    .url('Podaj poprawny URL')
    .max(512, 'URL: maksymalnie 512 znaków')
    .or(z.literal(''))
    .optional()
    .transform(emptyToUndefined),
  address: addressSchema.optional(),
})
/** Wartości pól formularza profilu (mogą zawierać puste stringi). */
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>
/** Payload po walidacji — puste pola jako undefined (gotowe do PATCH). */
export type ProfileUpdatePayload = z.output<typeof profileUpdateSchema>

// --- Zgłoszenie gry ------------------------------------------------------

/**
 * Pozycja z pola z podpowiedziami: `id` = wpis istniejący w słowniku,
 * brak `id` = nazwa wpisana ręcznie, którą backend utworzy w locie.
 */
const taxonomyPick = z.object({
  id: z.number().optional(),
  label: z.string().min(1),
  pending: z.boolean().optional(),
})

/** Rok wydania w przyszłości bywa zapowiedzią, ale nie za dziesięć lat. */
const MAX_FUTURE_YEARS = 2

/**
 * Formularz zgłoszenia gry. Odwzorowuje `GameRequestDto` razem z jego
 * ograniczeniami (tytuł ≤ 255, rok ≥ 1900, wiek 0–21) oraz dwiema regułami,
 * które backend zwraca jako błędy domenowe: `min <= max` graczy
 * (`INVALID_PLAYER_COUNT`) i wymagany co najmniej jeden wydawca
 * (`PUBLISHER_REQUIRED`) oraz kategoria (`CATEGORY_REQUIRED`).
 */
export const gameSubmissionSchema = z
  .object({
    title: z.string().trim().min(1, 'Podaj tytuł').max(255, 'Tytuł: maksymalnie 255 znaków'),
    description: z.string().trim().min(1, 'Podaj opis gry'),
    minPlayers: z.coerce.number().int('Podaj liczbę całkowitą').min(1, 'Co najmniej 1 gracz'),
    maxPlayers: z.coerce.number().int('Podaj liczbę całkowitą').min(1, 'Co najmniej 1 gracz'),
    playingTimeMinutes: z.coerce
      .number()
      .int('Podaj liczbę całkowitą')
      .min(1, 'Czas gry w minutach (min. 1)'),
    yearPublished: z.coerce
      .number()
      .int('Podaj liczbę całkowitą')
      .min(1900, 'Rok wydania od 1900')
      .max(new Date().getFullYear() + MAX_FUTURE_YEARS, 'Rok wydania z zbyt odległej przyszłości'),
    minAge: z.coerce.number().int('Podaj liczbę całkowitą').min(0).max(21, 'Wiek gracza: 0–21'),
    coverImageUrl: z
      .url('Podaj poprawny URL')
      .max(512, 'URL: maksymalnie 512 znaków')
      .or(z.literal(''))
      .optional()
      .transform(emptyToUndefined),
    publishers: z.array(taxonomyPick).min(1, 'Wskaż przynajmniej jednego wydawcę'),
    authors: z.array(taxonomyPick),
    categoryIds: z.array(z.number()).min(1, 'Wybierz przynajmniej jedną kategorię'),
    mechanicIds: z.array(z.number()),
  })
  .refine((d) => d.minPlayers <= d.maxPlayers, {
    message: 'Nie może być mniejsza od minimalnej liczby graczy',
    path: ['maxPlayers'],
  })
  // Nowy autor jedzie do API jako imię + nazwisko, więc sama nazwa nie wystarczy.
  .refine((d) => d.authors.every((a) => a.id !== undefined || a.label.trim().includes(' ')), {
    message: 'Nowego autora podaj jako imię i nazwisko',
    path: ['authors'],
  })

/** Wartości pól formularza (liczby przychodzą z inputów jako tekst). */
export type GameSubmissionInput = z.input<typeof gameSubmissionSchema>
/** Dane po walidacji — gotowe do złożenia `GameRequestDto`. */
export type GameSubmissionPayload = z.output<typeof gameSubmissionSchema>
