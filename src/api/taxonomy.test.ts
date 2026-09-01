import { describe, expect, it } from 'vitest'
import { captureQuery, makePage } from '@/test/fixtures'
import { suggestAuthors, suggestPublishers } from './taxonomy'
import { listPublishers } from './adminTaxonomy'

describe('podpowiedzi taksonomii', () => {
  it('wysyła frazę i domyślny limit', async () => {
    const captured = captureQuery('/api/v1/taxonomy/publishers/suggest', [])

    await suggestPublishers('look')

    expect(captured.params.get('q')).toBe('look')
    expect(captured.params.get('limit')).toBe('10')
  })

  it('pusta fraza nie trafia do query (backend traktuje ją jako początek listy)', async () => {
    const captured = captureQuery('/api/v1/taxonomy/authors/suggest', [])

    await suggestAuthors('', 25)

    expect(captured.params.has('q')).toBe(false)
    expect(captured.params.get('limit')).toBe('25')
  })
})

describe('admińska lista wydawców', () => {
  it('łączy stronicowanie z filtrem statusu i frazą', async () => {
    const captured = captureQuery('/api/v1/admin/taxonomy/publishers', makePage([]))

    await listPublishers({ status: 'PENDING', q: 'games' }, { page: 2, size: 50 })

    expect(captured.params.get('status')).toBe('PENDING')
    expect(captured.params.get('q')).toBe('games')
    expect(captured.params.get('page')).toBe('2')
    expect(captured.params.get('size')).toBe('50')
  })

  it('bez filtrów wysyła samo stronicowanie', async () => {
    const captured = captureQuery('/api/v1/admin/taxonomy/publishers', makePage([]))

    await listPublishers()

    expect([...captured.params.keys()].sort()).toEqual(['page', 'size'])
  })
})
