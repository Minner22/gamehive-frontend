import { describe, expect, it } from 'vitest'
import { gameFiltersToParams, parseGameFilters, parsePageParam } from './gameFilters'

describe('parseGameFilters', () => {
  it('czyta obsługiwane filtry z adresu', () => {
    const filters = parseGameFilters(
      new URLSearchParams('categoryId=3&mechanicId=2&players=4&maxPlayingTime=60&age=12'),
    )

    expect(filters).toEqual({
      categoryId: 3,
      mechanicId: 2,
      players: 4,
      maxPlayingTime: 60,
      age: 12,
    })
  })

  it('ignoruje śmieci i wartości niedodatnie — adres bywa ręcznie edytowany', () => {
    const filters = parseGameFilters(
      new URLSearchParams('categoryId=abc&players=0&age=-3&yearPublished=2007.5'),
    )

    expect(filters).toEqual({})
  })

  /** Wybór wydawcy wymaga podpowiedzi z /suggest — wchodzi razem z Comboboxem (GH-49). */
  it('nie czyta jeszcze wydawcy', () => {
    expect(parseGameFilters(new URLSearchParams('publisherId=1'))).toEqual({})
  })
})

describe('parsePageParam', () => {
  it('brak, zero i śmieci to pierwsza strona', () => {
    expect(parsePageParam(new URLSearchParams(''))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=0'))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=-2'))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=x'))).toBe(0)
  })

  it('czyta numer dalszej strony (wejście z linku)', () => {
    expect(parsePageParam(new URLSearchParams('page=3'))).toBe(3)
  })
})

describe('gameFiltersToParams', () => {
  it('pomija puste filtry i pierwszą stronę — adres zostaje czysty', () => {
    expect(gameFiltersToParams({ categoryId: 3 }).toString()).toBe('categoryId=3')
    expect(gameFiltersToParams({}).toString()).toBe('')
  })

  it('dopisuje stronę dopiero od drugiej', () => {
    expect(gameFiltersToParams({ players: 2 }, 2).toString()).toBe('players=2&page=2')
  })

  it('jest odwrotnością parsowania', () => {
    const filters = { categoryId: 1, players: 4, age: 8 }
    expect(parseGameFilters(gameFiltersToParams(filters, 5))).toEqual(filters)
  })
})
