import { describe, expect, it } from 'vitest'
import { resolveCollection, resolvePlayers, resolveValue } from './expansionValues'

describe('resolveValue', () => {
  it('brak własnej wartości = dziedziczenie z gry bazowej', () => {
    expect(resolveValue(null, 120)).toEqual({ value: 120, inherited: true })
    expect(resolveValue(undefined, 120)).toEqual({ value: 120, inherited: true })
  })

  it('własna wartość = nadpisanie (pokazujemy efektywną)', () => {
    expect(resolveValue(90, 90)).toEqual({ value: 90, inherited: false })
  })

  /** Zero jest poprawną wartością własną — nie wolno go pomylić z brakiem. */
  it('zero to nadpisanie, nie brak wartości', () => {
    expect(resolveValue(0, 0).inherited).toBe(false)
  })
})

describe('resolveCollection', () => {
  it('pusty własny zbiór = dziedziczenie', () => {
    expect(resolveCollection([], [{ id: 1 }])).toEqual({ value: [{ id: 1 }], inherited: true })
  })

  it('niepusty własny zbiór = nadpisanie', () => {
    expect(resolveCollection([{ id: 2 }], [{ id: 2 }]).inherited).toBe(false)
  })
})

describe('resolvePlayers', () => {
  it('oba pola puste = zakres dziedziczony', () => {
    expect(resolvePlayers(null, null, 1, 5)).toEqual({ value: '1–5', inherited: true })
  })

  /** Dodatek podnoszący tylko górną granicę nadal nadpisuje zakres. */
  it('nadpisanie jednej strony liczy się jako nadpisanie zakresu', () => {
    expect(resolvePlayers(null, 6, 1, 6)).toEqual({ value: '1–6', inherited: false })
  })

  it('równe granice pokazujemy jako jedną liczbę', () => {
    expect(resolvePlayers(2, 2, 2, 2).value).toBe('2')
  })
})
