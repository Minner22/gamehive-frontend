import { useCallback } from 'react'
import { approveGame, listModerationGames, rejectGame, unlockGame } from '@/api/moderation'
import type { GameModerationDto, ModerationQueueStatus } from '@/api/types'
import { ModerationQueue } from '@/components/games/ModerationQueue'
import { Badge, Icon } from '@/components/ui'

/** Dane, na których moderator faktycznie podejmuje decyzję. */
function GameDetails({ game }: Readonly<{ game: GameModerationDto }>) {
  return (
    <div className="space-y-3">
      {/* Cały opis, bez ucinania: podglądu nie ma dokąd otworzyć — patrz ModerationCard. */}
      <p className="whitespace-pre-line text-sm text-on-surface-variant">{game.description}</p>

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
  const fetchPage = useCallback(
    (status: ModerationQueueStatus, page: number, size: number) =>
      listModerationGames(status, { page, size }),
    [],
  )

  return (
    <ModerationQueue
      title="Moderacja: zgłoszenia gier"
      description="Zatwierdzenie dodaje grę do biblioteki i zatwierdza jej nowych wydawców oraz autorów."
      subjectGenitive="gry"
      fetchPage={fetchPage}
      toEntry={(game) => ({
        id: game.id,
        name: game.title,
        submittedBy: game.submittedBy,
        resubmissionCount: game.resubmissionCount,
        details: <GameDetails game={game} />,
        approve: async () => (await approveGame(game.id)).moderationStatus,
        reject: async (reason) => (await rejectGame(game.id, { reason })).moderationStatus,
        unlock: async () => (await unlockGame(game.id)).moderationStatus,
      })}
    />
  )
}
