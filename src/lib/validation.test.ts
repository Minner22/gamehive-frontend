import { describe, expect, it } from 'vitest'
import {
  deleteAccountSchema,
  loginSchema,
  profileUpdateSchema,
  registerFormSchema,
} from './validation'

describe('deleteAccountSchema', () => {
  it('wymaga niepustego hasła', () => {
    expect(deleteAccountSchema.safeParse({ password: '' }).success).toBe(false)
    expect(deleteAccountSchema.safeParse({ password: 'haslo123' }).success).toBe(true)
  })
})

describe('registerFormSchema', () => {
  const base = {
    username: 'jan.kowalski',
    email: 'jan@example.com',
    password: 'haslo1234',
  }

  it('odrzuca niezgodne hasła (na polu confirmPassword)', () => {
    const res = registerFormSchema.safeParse({ ...base, confirmPassword: 'inne' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === 'confirmPassword')).toBe(true)
    }
  })

  it('przepuszcza zgodne hasła', () => {
    expect(
      registerFormSchema.safeParse({ ...base, confirmPassword: base.password }).success,
    ).toBe(true)
  })
})

describe('loginSchema', () => {
  it('odrzuca niepoprawny e-mail', () => {
    expect(loginSchema.safeParse({ email: 'zły', password: 'x' }).success).toBe(false)
  })
})

describe('profileUpdateSchema', () => {
  it('puste pola → undefined (PATCH ich nie nadpisze)', () => {
    const out = profileUpdateSchema.parse({ firstName: '', lastName: 'Kowalski', phoneNumber: '' })
    expect(out.firstName).toBeUndefined()
    expect(out.lastName).toBe('Kowalski')
    expect(out.phoneNumber).toBeUndefined()
  })

  it('adres z samymi pustymi polami → cały adres undefined (bez {})', () => {
    const out = profileUpdateSchema.parse({
      address: { street: '', city: '', postalCode: '', country: '' },
    })
    expect(out.address).toBeUndefined()
  })

  it('adres z choć jednym polem → zachowany', () => {
    const out = profileUpdateSchema.parse({
      address: { street: '', city: 'Warszawa', postalCode: '', country: '' },
    })
    expect(out.address).toEqual({ city: 'Warszawa' })
  })

  it('phoneNumber: akceptuje E.164, odrzuca błędny', () => {
    expect(profileUpdateSchema.parse({ phoneNumber: '+48123456789' }).phoneNumber).toBe(
      '+48123456789',
    )
    expect(profileUpdateSchema.safeParse({ phoneNumber: '0048123' }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ phoneNumber: '+0123' }).success).toBe(false)
  })

  it('dateOfBirth: przeszłość OK, przyszłość odrzucona', () => {
    expect(profileUpdateSchema.safeParse({ dateOfBirth: '1990-01-01' }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({ dateOfBirth: '3000-01-01' }).success).toBe(false)
  })

  it('profilePictureUrl: poprawny URL OK, śmieci odrzucone', () => {
    expect(
      profileUpdateSchema.safeParse({ profilePictureUrl: 'https://x.io/a.png' }).success,
    ).toBe(true)
    expect(profileUpdateSchema.safeParse({ profilePictureUrl: 'notaurl' }).success).toBe(false)
  })
})
