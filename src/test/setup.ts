import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { clearAccessToken } from '@/api/tokenStore'
import { server } from './server'

// MSW: nieobsłużone żądania to błąd (wymusza świadome mockowanie w testach).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearAccessToken() // izolacja: token w pamięci nie przecieka między testami
})
afterAll(() => server.close())
