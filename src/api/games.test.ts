import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { captureQuery, makeGame, makePage, makeSearchResult } from '@/test/fixtures'
import { createGame, listGames, searchGames, submitGame, updateGame } from './games'
import type { GameRequestDto } from './types'

const requestDto: GameRequestDto = {
  title: 'Agricola',
  description: 'Gra o gospodarstwie',
  minPlayers: 1,
  maxPlayers: 5,
  playingTimeMinutes: 120,
  yearPublished: 2007,
  minAge: 12,
  categoryIds: [1],
  publisherIds: [1],
}

describe('listGames', () => {
  it('domyślnie wysyła tylko stronicowanie — bez pustych filtrów', async () => {
    const captured = captureQuery('/api/v1/games', makePage([makeGame()]))

    await listGames()

    expect(captured.params.get('page')).toBe('0')
    expect(captured.params.get('size')).toBe('20')
    expect([...captured.params.keys()].sort()).toEqual(['page', 'size'])
  })

  it('dokleja wyłącznie filtry, które mają wartość', async () => {
    const captured = captureQuery('/api/v1/games', makePage([]))

    await listGames({ categoryId: 3, players: 4, yearPublished: undefined })

    expect(captured.params.get('categoryId')).toBe('3')
    expect(captured.params.get('players')).toBe('4')
    expect(captured.params.has('yearPublished')).toBe(false)
    expect(captured.params.has('mechanicId')).toBe(false)
  })

  it('sort idzie jako powtórzony parametr (kontrakt Spring Data)', async () => {
    const captured = captureQuery('/api/v1/games', makePage([]))

    await listGames({}, { sort: ['title,asc', 'id,desc'] })

    expect(captured.params.getAll('sort')).toEqual(['title,asc', 'id,desc'])
  })
})

describe('searchGames', () => {
  it('nie wysyła sort — kolejność wyników to ranking trafności', async () => {
    const captured = captureQuery('/api/v1/games/search', makePage([makeSearchResult()]))

    await searchGames({ q: 'agricola' }, { sort: ['title,asc'] })

    expect(captured.params.has('sort')).toBe(false)
    expect(captured.params.get('q')).toBe('agricola')
  })

  it('przycina rozmiar strony do 50 (tak samo jak backend)', async () => {
    const captured = captureQuery('/api/v1/games/search', makePage([]))

    await searchGames({}, { size: 200 })

    expect(captured.params.get('size')).toBe('50')
  })

  it('przenosi filtry biblioteki i te dostępne tylko w wyszukiwarce', async () => {
    const captured = captureQuery('/api/v1/games/search', makePage([]))

    await searchGames({ targetType: 'EXPANSION', authorId: 7, baseGameId: 2, players: 3 })

    expect(captured.params.get('targetType')).toBe('EXPANSION')
    expect(captured.params.get('authorId')).toBe('7')
    expect(captured.params.get('baseGameId')).toBe('2')
    expect(captured.params.get('players')).toBe('3')
  })
})

describe('zapis zgłoszenia', () => {
  /**
   * `submit` jest po stronie backendu prymitywnym booleanem: brak pola to 400
   * VALIDATION_ERROR — także na PUT, który jego wartość ignoruje.
   */
  it('POST wysyła submit zgodnie z wyborem użytkownika', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/games`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeGame({ moderationStatus: 'PENDING' }), { status: 201 })
      }),
    )

    await createGame(requestDto, true)

    expect(body.submit).toBe(true)
    expect(body.title).toBe('Agricola')
  })

  it('PUT też zawsze niesie submit, mimo że backend go ignoruje', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.put(`${ANY_ORIGIN}/api/v1/games/5`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeGame({ id: 5 }))
      }),
    )

    await updateGame(5, requestDto)

    expect(body).toHaveProperty('submit')
  })

  it('submitGame trafia w ścieżkę zgłoszenia do moderacji', async () => {
    server.use(
      http.post(`${ANY_ORIGIN}/api/v1/games/9/submit`, () =>
        HttpResponse.json(makeGame({ id: 9, moderationStatus: 'PENDING' })),
      ),
    )

    await expect(submitGame(9)).resolves.toMatchObject({ moderationStatus: 'PENDING' })
  })
})
