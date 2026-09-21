import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { listCollectionExpansions, listCollectionGames } from '@/api/collection'
import { listMyExpansions } from '@/api/expansions'
import { listGames, listMyGames } from '@/api/games'
import { listModerationExpansions, listModerationGames } from '@/api/moderation'
import { Badge, ButtonLink, Card, Icon, Section } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

/**
 * Backend nie ma endpointu ze statystykami, więc liczniki biorą się z `totalElements`
 * stronicowanych list. `size=1` to najtańsza forma pytania „ile ich jest" — treść
 * strony i tak idzie do kosza.
 */
const ONE = { size: 1 }

async function sumTotals(...pages: Promise<{ totalElements: number }>[]): Promise<number> {
  const resolved = await Promise.all(pages)
  return resolved.reduce((total, page) => total + page.totalElements, 0)
}

const countCollection = () => sumTotals(listCollectionGames(ONE), listCollectionExpansions(ONE))
const countMySubmissions = () => sumTotals(listMyGames(ONE), listMyExpansions(ONE))
const countModerationQueue = () =>
  sumTotals(listModerationGames('PENDING', ONE), listModerationExpansions('PENDING', ONE))

/**
 * Rozmiar biblioteki czytamy z `/games`, nie z wyszukiwarki: tam `totalElements`
 * ma sufit 1000 (`maxTotalHits`), więc przy większym katalogu kłamałby.
 */
const countLibrary = async () => (await listGames({}, ONE)).totalElements

type CountState = { status: 'loading' } | { status: 'ok'; value: number } | { status: 'error' }

/** Kreska zamiast liczby: jeden nieudany licznik nie ma prawa wywalić dashboardu. */
function StatValue({ state }: Readonly<{ state: CountState }>) {
  if (state.status === 'loading') {
    return (
      <div
        aria-hidden="true"
        className="h-8 w-16 animate-pulse rounded-lg bg-surface-container-high"
      />
    )
  }
  if (state.status === 'error') {
    return (
      <p className="text-3xl font-bold text-on-surface-variant/40" title="Nie udało się pobrać">
        —
      </p>
    )
  }
  return <p className="font-headline text-3xl font-extrabold text-on-surface">{state.value}</p>
}

interface StatTileProps {
  icon: string
  label: string
  hint: string
  fetchCount: () => Promise<number>
}

function StatTile({ icon, label, hint, fetchCount }: Readonly<StatTileProps>) {
  const [state, setState] = useState<CountState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    fetchCount()
      .then((value) => active && setState({ status: 'ok', value }))
      .catch(() => active && setState({ status: 'error' }))
    return () => {
      active = false
    }
  }, [fetchCount])

  return (
    <Card className="space-y-2">
      <Icon name={icon} className="text-2xl text-primary" />
      <StatValue state={state} />
      <p className="text-sm font-medium text-on-surface">{label}</p>
      <p className="text-xs text-on-surface-variant">{hint}</p>
    </Card>
  )
}

const SHORTCUTS = [
  { to: ROUTES.games.library, icon: 'casino', label: 'Przeglądaj bibliotekę' },
  { to: ROUTES.games.search, icon: 'search', label: 'Szukaj gry' },
  { to: ROUTES.vault, icon: 'inventory_2', label: 'The Vault' },
  { to: ROUTES.games.new, icon: 'add', label: 'Zgłoś grę' },
]

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const name = user?.profile?.firstName || user?.username || 'graczu'
  const moderates = hasRole('ROLE_MODERATOR') || hasRole('ROLE_ADMIN')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Cześć, {name}!</h1>
        <p className="mt-1 text-on-surface-variant">
          Twój hub GameHive — kolekcja, zgłoszenia i biblioteka w jednym miejscu.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="inventory_2"
          label="Moja kolekcja"
          hint="Gry i dodatki w The Vault"
          fetchCount={countCollection}
        />
        <StatTile
          icon="edit_note"
          label="Moje zgłoszenia"
          hint="Szkice, oczekujące i odrzucone"
          fetchCount={countMySubmissions}
        />
        <StatTile
          icon="casino"
          label="Gry w bibliotece"
          hint="Pozycje zatwierdzone przez moderację"
          fetchCount={countLibrary}
        />
        {moderates && (
          <StatTile
            icon="gavel"
            label="Kolejka moderacji"
            hint="Zgłoszenia gier i dodatków czekające na decyzję"
            fetchCount={countModerationQueue}
          />
        )}
      </section>

      <Section title="Skróty">
        <div className="flex flex-wrap gap-3">
          {SHORTCUTS.map((shortcut) => (
            <ButtonLink
              key={shortcut.to}
              to={shortcut.to}
              variant="secondary"
              iconLeft={shortcut.icon}
            >
              {shortcut.label}
            </ButtonLink>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Twoje hive’y" action={<Badge tone="neutral">Wkrótce</Badge>}>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-on-surface-variant">
            <Icon name="groups" className="text-4xl opacity-40" />
            <p className="text-sm">Społeczności, do których należysz.</p>
            <p className="text-xs opacity-70">Czeka na endpointy po stronie backendu.</p>
          </div>
        </Section>

        <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-headline text-lg font-bold">Uzupełnij profil</h2>
            <p className="text-sm text-on-surface-variant">
              Dodaj dane i zdjęcie, żeby Twój hive wiedział, kim jesteś.
            </p>
          </div>
          <ButtonLink to={ROUTES.profileEdit} variant="secondary" iconLeft="edit">
            Edytuj profil
          </ButtonLink>
        </Card>
      </div>
    </div>
  )
}
