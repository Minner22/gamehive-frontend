import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ANY_ORIGIN } from '@/test/handlers'
import { deleteAccount } from './users'

describe('deleteAccount — interakcja z interceptorem 401', () => {
  it('401 INVALID_PASSWORD: NIE odświeża i NIE ponawia (DELETE woła się raz)', async () => {
    let deleteCalls = 0
    let refreshCalls = 0
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => {
        refreshCalls++
        return HttpResponse.json({ accessToken: 't' })
      }),
      http.delete(`${ANY_ORIGIN}/api/v1/users/me`, () => {
        deleteCalls++
        return HttpResponse.json({ errorCode: 'INVALID_PASSWORD' }, { status: 401 })
      }),
    )

    await expect(deleteAccount({ password: 'wrong' })).rejects.toMatchObject({
      response: { status: 401, data: { errorCode: 'INVALID_PASSWORD' } },
    })
    expect(deleteCalls).toBe(1)
    expect(refreshCalls).toBe(0)
  })

  it('zwykłe 401 (wygasły token): odświeża i ponawia (DELETE → refresh → DELETE)', async () => {
    let deleteCalls = 0
    let refreshCalls = 0
    server.use(
      http.get(`${ANY_ORIGIN}/api/v1/auth/refresh`, () => {
        refreshCalls++
        return HttpResponse.json({ accessToken: 't' })
      }),
      http.delete(`${ANY_ORIGIN}/api/v1/users/me`, () => {
        deleteCalls++
        return deleteCalls === 1
          ? new HttpResponse(null, { status: 401 })
          : new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(deleteAccount({ password: 'x' })).resolves.toBeUndefined()
    expect(refreshCalls).toBe(1)
    expect(deleteCalls).toBe(2)
  })
})
