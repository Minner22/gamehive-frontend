import { describe, expect, it } from 'vitest'
import {
  applicableFilters,
  catalogHref,
  catalogQueryToParams,
  catalogSource,
  databaseQuery,
  legacyCatalogHref,
  parseCatalogQuery,
  parsePageParam,
  type CatalogQuery,
} from './catalog'

const parse = (search: string) => parseCatalogQuery(new URLSearchParams(search))

describe('parseCatalogQuery', () => {
  it('bez parametrów to zakładka Gry bez filtrów', () => {
    expect(parse('')).toEqual({ type: 'game', q: undefined, filters: {} })
  })

  it('czyta zakładkę, frazę i filtry z adresu', () => {
    expect(parse('type=all&q=%20wingspan%20&categoryId=2&players=4&authorId=9')).toEqual({
      type: 'all',
      q: 'wingspan',
      filters: { categoryId: 2, players: 4, authorId: 9 },
    })
  })

  it('ignoruje nieznaną zakładkę, śmieci i wartości niedodatnie — adres bywa edytowany ręcznie', () => {
    expect(parse('type=hives&categoryId=abc&players=0&age=-3&maxPlayingTime=1.5')).toEqual({
      type: 'game',
      q: undefined,
      filters: {},
    })
  })

  it('nie czyta wydawcy — wybór wymaga podpowiedzi z /suggest', () => {
    expect(parse('publisherId=3').filters).toEqual({})
  })

  /** Rok wydania przy dodatkach zawężałby wyniki po cichu do zera — dodatek nie ma tego pola. */
  it('pomija filtry, które w danej zakładce nie mają sensu', () => {
    expect(parse('type=expansion&yearPublished=2019&authorId=1&baseGameId=7').filters).toEqual({
      baseGameId: 7,
    })
    expect(parse('baseGameId=7').filters).toEqual({})
  })
})

describe('catalogQueryToParams', () => {
  it('pomija domyślną zakładkę, puste filtry i pierwszą stronę — adres zostaje czysty', () => {
    expect(catalogQueryToParams({ type: 'game', filters: {} }).toString()).toBe('')
  })

  it('dopisuje stronę dopiero od drugiej', () => {
    expect(catalogQueryToParams({ type: 'game', filters: {} }, 2).toString()).toBe('page=2')
  })

  it('jest odwrotnością parsowania', () => {
    const query: CatalogQuery = {
      type: 'expansion',
      q: 'rzeka',
      filters: { categoryId: 1, players: 2, baseGameId: 7 },
    }
    expect(parseCatalogQuery(catalogQueryToParams(query))).toEqual(query)
  })
})

describe('parsePageParam', () => {
  it('brak, zero i śmieci to pierwsza strona; dalsza strona z linku jest czytana', () => {
    expect(parsePageParam(new URLSearchParams(''))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=0'))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=x'))).toBe(0)
    expect(parsePageParam(new URLSearchParams('page=3'))).toBe(3)
  })
})

/**
 * Serce scalonego ekranu: baza zawsze, gdy wystarcza (pełna lista, bez sufitu 1000
 * i bez zależności od Meilisearch), wyszukiwarka dopiero wtedy, gdy baza nie umie.
 */
describe('catalogSource', () => {
  it('bez frazy Gry i Dodatki czytają z bazy', () => {
    expect(catalogSource({ type: 'game', filters: { categoryId: 1, players: 4, yearPublished: 2019 } })).toBe('games')
    expect(catalogSource({ type: 'expansion', filters: { categoryId: 1, baseGameId: 7 } })).toBe('expansions')
  })

  it('fraza zawsze idzie do wyszukiwarki', () => {
    expect(catalogSource({ type: 'game', q: 'wingspan', filters: {} })).toBe('search')
    expect(catalogSource({ type: 'expansion', q: 'rzeka', filters: {} })).toBe('search')
  })

  it('„Wszystko” idzie do wyszukiwarki — baza nie łączy gier z dodatkami', () => {
    expect(catalogSource({ type: 'all', filters: {} })).toBe('search')
  })

  /** Baza dodatków filtruje tylko po słownikach i grze bazowej; reszta to wartości efektywne. */
  it('filtr nieobsługiwany przez bazę przełącza na wyszukiwarkę', () => {
    expect(catalogSource({ type: 'expansion', filters: { players: 2 } })).toBe('search')
    expect(catalogSource({ type: 'game', filters: { authorId: 3 } })).toBe('search')
  })
})

describe('applicableFilters i databaseQuery', () => {
  it('zmiana zakładki zrzuca filtry, które w nowej nie pasują', () => {
    expect(applicableFilters('expansion', { categoryId: 1, yearPublished: 2019 })).toEqual({ categoryId: 1 })
    expect(applicableFilters('game', { categoryId: 1, baseGameId: 7 })).toEqual({ categoryId: 1 })
  })

  it('wyjście awaryjne bez wyszukiwarki: bez frazy, „Wszystko” → Gry, tylko filtry bazy', () => {
    expect(databaseQuery({ type: 'all', q: 'x', filters: { categoryId: 1, authorId: 3 } })).toEqual({
      type: 'game',
      filters: { categoryId: 1 },
    })
    expect(databaseQuery({ type: 'expansion', q: 'x', filters: { players: 2, baseGameId: 7 } })).toEqual({
      type: 'expansion',
      filters: { baseGameId: 7 },
    })
  })
})

describe('linki', () => {
  it('catalogHref buduje adres katalogu', () => {
    expect(catalogHref()).toBe('/games')
    expect(catalogHref({ type: 'expansion', filters: { baseGameId: 7 } })).toBe('/games?type=expansion&baseGameId=7')
  })

  /** Linki z historii i zakładki w przeglądarce mają prowadzić w to samo miejsce. */
  it('stare adresy przekładają się na katalog z zachowaniem kryteriów', () => {
    expect(legacyCatalogHref('/games/search', '?q=wingspan&targetType=EXPANSION&page=2')).toBe(
      '/games?type=expansion&q=wingspan&page=2',
    )
    expect(legacyCatalogHref('/games/search', '?q=wingspan&targetType=GAME')).toBe('/games?q=wingspan')
    expect(legacyCatalogHref('/games/search', '')).toBe('/games?type=all')
    expect(legacyCatalogHref('/expansions', '?baseGameId=7&categoryId=1')).toBe(
      '/games?type=expansion&categoryId=1&baseGameId=7',
    )
  })
})
