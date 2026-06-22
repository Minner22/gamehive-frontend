import { describe, expect, it } from 'vitest'
import { displayRoles, roleLabel } from './roles'

describe('displayRoles', () => {
  it('pomija ROLE_USER i ścina prefiks ROLE_', () => {
    expect(displayRoles(['ROLE_USER', 'ROLE_ADMIN'])).toEqual(['ADMIN'])
    expect(displayRoles(['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN'])).toEqual([
      'MODERATOR',
      'ADMIN',
    ])
  })

  it('zwraca [] dla undefined oraz dla samego ROLE_USER', () => {
    expect(displayRoles(undefined)).toEqual([])
    expect(displayRoles(['ROLE_USER'])).toEqual([])
  })
})

describe('roleLabel', () => {
  it('mapuje znane role na polskie etykiety', () => {
    expect(roleLabel('ROLE_ADMIN')).toBe('Administrator')
    expect(roleLabel('ROLE_MODERATOR')).toBe('Moderator')
    expect(roleLabel('ROLE_USER')).toBe('Użytkownik')
  })

  it('dla nieznanej roli ścina prefiks ROLE_', () => {
    expect(roleLabel('ROLE_SUPPORT')).toBe('SUPPORT')
  })
})
