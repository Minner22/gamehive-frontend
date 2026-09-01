import { describe, expect, it } from 'vitest'
import { formatAuthorName, splitAuthorName } from './authorName'

describe('splitAuthorName', () => {
  it('dzieli na pierwszej spacji', () => {
    expect(splitAuthorName('Uwe Rosenberg')).toEqual({ firstName: 'Uwe', lastName: 'Rosenberg' })
  })

  /** Wieloczłonowe nazwisko musi zostać w całości po stronie nazwiska. */
  it('wszystko po pierwszej spacji jest nazwiskiem', () => {
    expect(splitAuthorName('Ludwig van Beethoven')).toEqual({
      firstName: 'Ludwig',
      lastName: 'van Beethoven',
    })
  })

  it('scala nadmiarowe spacje', () => {
    expect(splitAuthorName('  Klaus-Jürgen   Wrede ')).toEqual({
      firstName: 'Klaus-Jürgen',
      lastName: 'Wrede',
    })
  })

  it('sama nazwa bez nazwiska to za mało', () => {
    expect(splitAuthorName('Rosenberg')).toBeNull()
    expect(splitAuthorName('   ')).toBeNull()
  })
})

describe('formatAuthorName', () => {
  it('składa imię i nazwisko', () => {
    expect(formatAuthorName({ firstName: 'Uwe', lastName: 'Rosenberg' })).toBe('Uwe Rosenberg')
  })

  it('radzi sobie z brakiem części danych', () => {
    expect(formatAuthorName({ lastName: 'Rosenberg' })).toBe('Rosenberg')
    expect(formatAuthorName({})).toBe('')
  })
})
