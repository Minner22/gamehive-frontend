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

export const resendActivationSchema = z.object({ email })
export type ResendActivationInput = z.infer<typeof resendActivationSchema>

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

export const addressSchema = z.object({
  street: optionalText(255, 'Ulica'),
  city: optionalText(255, 'Miasto'),
  postalCode: optionalText(20, 'Kod pocztowy'),
  country: optionalText(100, 'Kraj'),
})

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
