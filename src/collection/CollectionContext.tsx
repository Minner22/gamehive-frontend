import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isAxiosError } from 'axios'
import {
  addExpansionToCollection,
  addGameToCollection,
  listCollectionExpansions,
  listCollectionGames,
  removeExpansionFromCollection,
  removeGameFromCollection,
} from '@/api/collection'
import type { ApiError } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

/**
 * Ile pozycji wczytujemy, żeby wiedzieć, co użytkownik już ma. Backend nie ma
 * endpointu „czy mam tę grę", więc jedyną drogą jest przejrzenie kolekcji.
 * Powyżej tego progu przyciski działają optymistycznie i polegają na 409 —
 * kolekcja większa niż 200 pozycji jest w tym module rzadkim przypadkiem.
 */
const MEMBERSHIP_PAGE_SIZE = 200

export type CollectionTarget = 'game' | 'expansion'

interface CollectionContextValue {
  /** Czy dana pozycja jest w kolekcji. `false` przy niepełnej wiedzy znaczy „nie wiadomo". */
  owns: (target: CollectionTarget, id: number) => boolean
  /** Zwraca `true`, gdy po operacji pozycja na pewno jest w kolekcji. */
  add: (target: CollectionTarget, id: number) => Promise<boolean>
  /** Zwraca `true`, gdy po operacji pozycji na pewno nie ma w kolekcji. */
  remove: (target: CollectionTarget, id: number) => Promise<boolean>
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

function errorCodeOf(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data as ApiError | undefined)?.errorCode
}

/** Zbiory identyfikatorów zawsze razem z właścicielem, do którego należą. */
interface Membership {
  ownerId: string | null
  games: ReadonlySet<number>
  expansions: ReadonlySet<number>
}

const EMPTY_MEMBERSHIP: Membership = { ownerId: null, games: new Set(), expansions: new Set() }

export function CollectionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { status, user } = useAuth()
  const toast = useToast()
  const [membership, setMembership] = useState<Membership>(EMPTY_MEMBERSHIP)
  const ownerId = user?.id ?? null

  // Wiedza o kolekcji jest przypisana do konkretnego konta — po wylogowaniu
  // przestaje pasować i `owns` przestaje ją brać pod uwagę, bez czyszczenia stanu
  // w ciele efektu.
  useEffect(() => {
    if (status !== 'authenticated' || !ownerId) return
    let active = true
    Promise.all([
      listCollectionGames({ size: MEMBERSHIP_PAGE_SIZE }),
      listCollectionExpansions({ size: MEMBERSHIP_PAGE_SIZE }),
    ])
      .then(([gamePage, expansionPage]) => {
        if (!active) return
        setMembership({
          ownerId,
          games: new Set(gamePage.content.map((item) => item.game.id)),
          expansions: new Set(expansionPage.content.map((item) => item.expansion.id)),
        })
      })
      // Brak tej wiedzy nie psuje aplikacji — przyciski zadziałają optymistycznie.
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [status, ownerId])

  const owns = useCallback(
    (target: CollectionTarget, id: number) => {
      if (membership.ownerId !== ownerId) return false
      return target === 'game' ? membership.games.has(id) : membership.expansions.has(id)
    },
    [membership, ownerId],
  )

  const mark = useCallback(
    (target: CollectionTarget, id: number, owned: boolean) => {
      setMembership((previous) => {
        const source = previous.ownerId === ownerId ? previous : { ...EMPTY_MEMBERSHIP, ownerId }
        const next = new Set(target === 'game' ? source.games : source.expansions)
        if (owned) next.add(id)
        else next.delete(id)
        return target === 'game'
          ? { ...source, ownerId, games: next }
          : { ...source, ownerId, expansions: next }
      })
    },
    [ownerId],
  )

  const add = useCallback(
    async (target: CollectionTarget, id: number) => {
      try {
        await (target === 'game' ? addGameToCollection(id) : addExpansionToCollection(id))
        mark(target, id, true)
        toast.success('Dodano do kolekcji.')
        return true
      } catch (err) {
        // Duplikat to nie awaria — stan po prostu już jest taki, jakiego chcemy.
        if (errorCodeOf(err) === 'ALREADY_IN_COLLECTION') {
          mark(target, id, true)
          toast.info('Masz już to w kolekcji.')
          return true
        }
        toast.error(getApiErrorMessage(err))
        return false
      }
    },
    [mark, toast],
  )

  const remove = useCallback(
    async (target: CollectionTarget, id: number) => {
      try {
        await (target === 'game'
          ? removeGameFromCollection(id)
          : removeExpansionFromCollection(id))
        mark(target, id, false)
        toast.success('Usunięto z kolekcji.')
        return true
      } catch (err) {
        // Wpisu i tak już nie ma — dociągamy stan lokalny do rzeczywistości.
        if (errorCodeOf(err) === 'COLLECTION_ITEM_NOT_FOUND') {
          mark(target, id, false)
          return true
        }
        toast.error(getApiErrorMessage(err))
        return false
      }
    },
    [mark, toast],
  )

  const value = useMemo(() => ({ owns, add, remove }), [owns, add, remove])

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCollection(): CollectionContextValue {
  const context = useContext(CollectionContext)
  if (!context) throw new Error('useCollection musi być użyte wewnątrz <CollectionProvider>')
  return context
}
