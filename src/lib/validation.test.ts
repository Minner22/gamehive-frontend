import { describe, expect, it } from 'vitest'
import { loginSchema, profileUpdateSchema, registerFormSchema } from './validation'

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
})
