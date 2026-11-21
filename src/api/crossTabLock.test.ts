import { afterEach, describe, expect, it } from 'vitest'
import { installFakeLocks, removeLocks } from '@/test/fakeLocks'
import { withCrossTabLock } from './crossTabLock'

/** Obietnica do ręcznego rozstrzygnięcia — pozwala trzymać „pierwszą kartę” w trakcie pracy. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

let cleanup: () => void = () => undefined

describe('withCrossTabLock', () => {
  afterEach(() => cleanup())

  it('z Web Locks drugie wywołanie startuje dopiero po zakończeniu pierwszego', async () => {
    cleanup = installFakeLocks()
    const first = deferred<string>()
    const started: string[] = []

    const a = withCrossTabLock('x', () => {
      started.push('a')
      return first.promise
    })
    const b = withCrossTabLock('x', async () => {
      started.push('b')
      return 'b'
    })

    await flush()
    expect(started).toEqual(['a'])

    first.resolve('a')
    await expect(a).resolves.toBe('a')
    await expect(b).resolves.toBe('b')
    expect(started).toEqual(['a', 'b'])
  })

  /** Nieudane odświeżenie jednej karty nie może zablokować pozostałych na zawsze. */
  it('błąd pierwszego zwalnia blokadę i trafia tylko do niego', async () => {
    cleanup = installFakeLocks()

    const a = withCrossTabLock('x', () => Promise.reject(new Error('sieć')))
    const b = withCrossTabLock('x', async () => 'b')

    await expect(a).rejects.toThrow('sieć')
    await expect(b).resolves.toBe('b')
  })

  it('różne nazwy blokad nie czekają na siebie', async () => {
    cleanup = installFakeLocks()
    const first = deferred<string>()

    void withCrossTabLock('x', () => first.promise)
    await expect(withCrossTabLock('y', async () => 'y')).resolves.toBe('y')
    first.resolve('x')
  })

  /** Stara przeglądarka albo brak HTTPS (Web Locks wymaga secure context) — zachowanie sprzed #80. */
  it('bez Web Locks wykonuje funkcję od razu', async () => {
    cleanup = removeLocks()
    const first = deferred<string>()
    const started: string[] = []

    void withCrossTabLock('x', () => {
      started.push('a')
      return first.promise
    })
    const b = withCrossTabLock('x', async () => {
      started.push('b')
      return 'b'
    })

    await expect(b).resolves.toBe('b')
    expect(started).toEqual(['a', 'b'])
    first.resolve('a')
  })
})
