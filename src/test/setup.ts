import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { clearAccessToken } from '@/api/tokenStore'
import { resetTaxonomyCache } from '@/lib/useTaxonomyOptions'
import { server } from './server'

// MSW: nieobsłużone żądania to błąd (wymusza świadome mockowanie w testach).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearAccessToken() // izolacja: token w pamięci nie przecieka między testami
  // Słowniki taksonomii są zapamiętywane na poziomie modułu (jedno pobranie na
  // sesję). Bez tego resetu drugi test dostawałby listy z pierwszego i nie
  // dotykał handlera MSW — izolacja zależałaby od kolejności plików.
  resetTaxonomyCache()
})
afterAll(() => server.close())
