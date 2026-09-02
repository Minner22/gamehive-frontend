import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getGame } from '@/api/games'
import { listExpansions } from '@/api/expansions'
import type { GameDto } from '@/api/types'
import { ExpansionCard } from '@/components/games/ExpansionCard'
import { CollectionButton } from '@/components/games/CollectionButton'
import { ModerationStatusBadge } from '@/components/games/ModerationStatusBadge'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Icon,
  ListSkeleton,
  Section,
  Spinner,
} from '@/components/ui'
import { pluralPl } from '@/lib/plural'
import { useResource } from '@/lib/useResource'
import { ROUTES } from '@/routes/paths'

/** Ile dodatków pokazujemy pod grą; więcej i tak należy do widoku dodatków (GH-47). */
const EXPANSIONS_SIZE = 12

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-4 text-center">
      <Icon name={icon} className="text-2xl text-primary" aria-hidden="true" />
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="font-semibold text-on-surface">{value}</span>
    </div>
  )
}

function Cover({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-surface-variant">
        <Icon name="casino" className="text-6xl text-on-surface-variant/50" aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={`Okładka gry ${title}`}
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full rounded-2xl bg-surface-variant object-cover shadow-soft"
    />
  )
}

/** Lista nazw (wydawcy, autorzy) — pusta sekcja nie ma po co zajmować miejsca. */
function NameList({ icon, label, names }: { icon: string; label: string; names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon name={icon} className="text-base text-on-surface-variant" aria-hidden="true" />
      <span className="text-on-surface-variant">{label}:</span>
      <span className="font-medium text-on-surface">{names.join(', ')}</span>
    </div>
  )
}

function GameExpansions({ gameId }: { gameId: number }) {
  const fetchExpansions = useCallback(
    () => listExpansions({ baseGameId: gameId }, { page: 0, size: EXPANSIONS_SIZE }),
    [gameId],
  )
  const { state, reload } = useResource(fetchExpansions)

  // Sekcja pokazuje pierwszą stronę; pełna lista (z filtrami) żyje w bibliotece dodatków.
  const allExpansionsHref = `${ROUTES.expansions.library}?baseGameId=${gameId}`

  return (
    <Section
      title="Dodatki"
      action={
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            to={`${ROUTES.expansions.new}?baseGameId=${gameId}`}
            variant="ghost"
            size="sm"
            iconLeft="add"
          >
            Zgłoś dodatek
          </ButtonLink>
          {state.status === 'ok' && !state.data.empty && (
            <ButtonLink to={allExpansionsHref} variant="ghost" size="sm" iconRight="arrow_forward">
              Wszystkie
            </ButtonLink>
          )}
        </div>
      }
    >
      {state.status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          <ListSkeleton count={3} className="h-40" />
        </div>
      )}

      {/* Błąd listy dodatków nie może przewrócić strony gry — to osobne zapytanie. */}
      {(state.status === 'error' || state.status === 'notFound') && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
          <span>Nie udało się wczytać dodatków.</span>
          <Button size="sm" variant="secondary" iconLeft="refresh" onClick={reload}>
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {state.status === 'ok' &&
        (state.data.empty ? (
          <p className="text-sm text-on-surface-variant">
            Ta gra nie ma jeszcze zatwierdzonych dodatków.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.content.map((expansion) => (
              <ExpansionCard key={expansion.id} expansion={expansion} />
            ))}
          </div>
        ))}
    </Section>
  )
}

function GameDetail({ game }: { game: GameDto }) {
  const players =
    game.minPlayers === game.maxPlayers
      ? `${game.minPlayers}`
      : `${game.minPlayers}–${game.maxPlayers}`

  return (
    <div className="space-y-6">
      <ButtonLink to={ROUTES.games.library} variant="ghost" size="sm" iconLeft="arrow_back">
        Biblioteka gier
      </ButtonLink>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Cover url={game.coverImageUrl} title={game.title} />
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-4xl font-extrabold tracking-tight">{game.title}</h1>
              {game.moderationStatus !== 'APPROVED' && (
                <ModerationStatusBadge status={game.moderationStatus} />
              )}
            </div>
            <p className="leading-relaxed text-on-surface-variant">{game.description}</p>
          </div>

          {/* Powód odrzucenia widzi tylko autor — cudze zgłoszenia dają 404. */}
          {game.moderationStatus === 'REJECTED' && game.rejectionReason && (
            <Card className="bg-error-container">
              <p className="text-sm font-bold text-on-error-container">Powód odrzucenia</p>
              <p className="mt-1 text-sm text-on-error-container">{game.rejectionReason}</p>
            </Card>
          )}

          <CollectionButton target="game" id={game.id} name={game.title} size="md" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon="group" label="Gracze" value={players} />
            <StatTile icon="schedule" label="Czas" value={`${game.playingTimeMinutes} min`} />
            <StatTile icon="cake" label="Wiek" value={`${game.minAge}+`} />
            <StatTile icon="calendar_month" label="Rok" value={String(game.yearPublished)} />
          </div>

          <div className="space-y-2">
            <NameList
              icon="apartment"
              label="Wydawcy"
              names={game.publishers.map((p) => p.name ?? '')}
            />
            <NameList
              icon="edit"
              label="Autorzy"
              names={game.authors.map((a) => `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())}
            />
          </div>

          {(game.categories.length > 0 || game.mechanics.length > 0) && (
            <div className="space-y-3">
              {game.categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-on-surface-variant">
                    {pluralPl(game.categories.length, 'Kategoria', 'Kategorie', 'Kategorie')}:
                  </span>
                  {game.categories.map((category) => (
                    <Badge key={category.id} tone="gold">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              {game.mechanics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-on-surface-variant">
                    {pluralPl(game.mechanics.length, 'Mechanika', 'Mechaniki', 'Mechaniki')}:
                  </span>
                  {game.mechanics.map((mechanic) => (
                    <Badge key={mechanic.id}>{mechanic.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <GameExpansions gameId={game.id} />
    </div>
  )
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const gameId = Number(id)
  const valid = Number.isInteger(gameId) && gameId > 0

  const fetchGame = useCallback(() => getGame(gameId), [gameId])
  const { state, reload } = useResource(fetchGame)

  if (!valid || state.status === 'notFound') {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono gry"
        description="Gra o tym adresie nie istnieje albo została usunięta z biblioteki."
        action={
          <ButtonLink to={ROUTES.games.library} variant="secondary" iconLeft="arrow_back">
            Wróć do biblioteki
          </ButtonLink>
        }
      />
    )
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        icon="cloud_off"
        title="Nie udało się wczytać gry"
        description="Sprawdź połączenie i spróbuj ponownie."
        action={
          <Button variant="secondary" iconLeft="refresh" onClick={reload}>
            Spróbuj ponownie
          </Button>
        }
      />
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-3xl text-primary" label="Ładowanie gry…" />
      </div>
    )
  }

  return <GameDetail game={state.data} />
}
