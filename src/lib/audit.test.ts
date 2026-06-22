import { describe, expect, it } from 'vitest'
import { parseRoleChange, roleDiff } from './audit'

describe('parseRoleChange', () => {
  it('parsuje JSON {before, after}', () => {
    expect(
      parseRoleChange('{"before":["ROLE_USER"],"after":["ROLE_USER","ROLE_MODERATOR"]}'),
    ).toEqual({ before: ['ROLE_USER'], after: ['ROLE_USER', 'ROLE_MODERATOR'] })
  })

  it('zwraca null dla zwykłego tekstu, undefined i niepasującego JSON-a', () => {
    expect(parseRoleChange('konto testowe')).toBeNull()
    expect(parseRoleChange(undefined)).toBeNull()
    expect(parseRoleChange('{"foo":1}')).toBeNull()
  })
})

describe('roleDiff', () => {
  it('wyznacza role dodane i usunięte', () => {
    expect(roleDiff({ before: ['ROLE_USER'], after: ['ROLE_USER', 'ROLE_MODERATOR'] })).toEqual({
      added: ['ROLE_MODERATOR'],
      removed: [],
    })
    expect(roleDiff({ before: ['ROLE_USER', 'ROLE_ADMIN'], after: ['ROLE_USER'] })).toEqual({
      added: [],
      removed: ['ROLE_ADMIN'],
    })
  })
})
