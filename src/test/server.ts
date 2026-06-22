import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Współdzielony serwer MSW (Node) — sterowany z setup.ts. */
export const server = setupServer(...handlers)
