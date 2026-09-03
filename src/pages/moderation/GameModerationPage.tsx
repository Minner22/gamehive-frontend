import { useCallback, useState } from 'react'
import { approveGame, listPendingGames, rejectGame, unlockGame } from '@/api/moderation'
import type { GameModerationDto, ModerationStatus } from '@/api/types'
import { ModerationCard } from '@/components/games/ModerationCard'
import { ResultsSection } from '@/components/games/ResultsSection'
import { Badge, EmptyState, Icon } from '@/components/ui'
import { pluralPl } from '@/lib/plural'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { ROUTES } from '@/routes/paths'

const PAGE_SIZE = 10

/** Dane, na których moderator faktycznie podejmuje decyzję. */
function GameDetails({ game }: Readonly<{ game: GameModerationDto }>) {
  return (
    <div className="space-y-3">
      <p className="line-clamp-3 text-sm text-on-surface-variant">{game.description}</p>

      <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
        <span className="flex items-center gap-1" title="Liczba graczy">
          <Icon name="group" className="text-base" aria-hidden="true" />
          {game.minPlayers === game.maxPlayers
            ? game.minPlayers
            : `${game.minPlayers}–${game.maxPlayers}`}
        </span>
        <span className="flex items-center gap-1" title="Czas gry">
          <Icon name="schedule" className="text-base" aria-hidden="true" />
          {game.playingTimeMinutes} min
        </span>
        <span className="flex items-center gap-1" title="Wiek gracza">
          <Icon name="cake" className="text-base" aria-hidden="true" />
          {game.minAge}+
        </span>
        <span className="flex items-center gap-1" title="Rok wydania">
          <Icon name="calendar_month" className="text-base" aria-hidden="true" />
          {game.yearPublished}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {game.publishers.map((publisher) => (
          <Badge key={publisher.id} tone={publisher.status === 'PENDING' ? 'gold' : 'neutral'}>
            {publisher.name}
            {publisher.status === 'PENDING' && ' • nowy'}
          </Badge>
        ))}
        {game.authors.map((author) => (
          <Badge key={author.id} tone={author.status === 'PENDING' ? 'gold' : 'neutral'}>
            {author.firstName} {author.lastName}
            {author.status === 'PENDING' && ' • nowy'}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {game.categories.map((category) => (
          <Badge key={category.id} tone="info">
            {category.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default function GameModerationPage() {
  const fetchPage = useCallback((page: number) => listPendingGames({ page, size: PAGE_SIZE }), [])
  const { data, loading, goToPage, reload } = usePaginatedList(fetchPage)

  // Po decyzji zgłoszenie znika z kolejki po stronie backendu, ale zostaje na ekranie
  // z widocznym skutkiem — inaczej lista skakałaby moderatorowi pod rękami.
  const [decisions, setDecisions] = useState<Record<number, ModerationStatus>>({})

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">
          Moderacja: zgłoszenia gier
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Zatwierdzenie dodaje grę do biblioteki i zatwierdza jej nowych wydawców oraz autorów.
        </p>
      </header>

      <ResultsSection
        data={data}
        loading={loading}
        onReload={reload}
        onPageChange={goToPage}
        loadingLabel="Ładowanie kolejki…"
        errorTitle="Nie udało się wczytać kolejki"
        unit={pluralPl(data?.totalElements ?? 0, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}
        skeletonClassName="h-64"
        empty={
          <EmptyState
            icon="task_alt"
            title="Kolejka jest pusta"
            description="Żadne zgłoszenie gry nie czeka teraz na decyzję."
          />
        }
      >
        {(game) => (
          <ModerationCard
            key={game.id}
            decidedAs={decisions[game.id]}
            onDecided={(status) => setDecisions((current) => ({ ...current, [game.id]: status }))}
            entry={{
              id: game.id,
              name: game.title,
              submittedBy: game.submittedBy,
              resubmissionCount: game.resubmissionCount,
              detailHref: ROUTES.games.detail(game.id),
              details: <GameDetails game={game} />,
              approve: async () => (await approveGame(game.id)).moderationStatus,
              reject: async (reason) =>
                (await rejectGame(game.id, { reason })).moderationStatus,
              unlock: async () => (await unlockGame(game.id)).moderationStatus,
            }}
          />
        )}
      </ResultsSection>
    </div>
  )
}
