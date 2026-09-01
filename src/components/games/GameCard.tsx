import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameDto } from '@/api/types'
import { Badge, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'
import { ModerationStatusBadge } from './ModerationStatusBadge'

/** Ile kategorii mieści się w stopce karty, zanim zwiniemy resztę do „+N". */
const VISIBLE_CATEGORIES = 3

interface GameCardProps {
  game: GameDto
  /**
   * Akcja w stopce karty (np. „Dodaj do kolekcji" — GH-48). Renderowana nad
   * rozciągniętym linkiem, więc klik w przycisk nie otwiera szczegółów.
   */
  action?: ReactNode
}

function Meta({ icon, children, title }: { icon: string; children: ReactNode; title: string }) {
  return (
    <span className="flex items-center gap-1" title={title}>
      <Icon name={icon} className="text-base" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Okładka albo zastępczy heksagon — `coverImageUrl` bywa puste i bywa martwe. */
function Cover({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className="flex h-44 items-center justify-center bg-surface-variant">
        <Icon name="casino" className="text-5xl text-on-surface-variant/50" aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={`Okładka gry ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-44 w-full bg-surface-variant object-cover"
    />
  )
}

/**
 * Karta gry w siatce biblioteki. Cały kafelek jest klikalny dzięki linkowi
 * rozciągniętemu przez `before:absolute` — dzięki temu w drzewie dostępności
 * jest jeden link (tytuł), a nie kilka odsyłaczy do tego samego miejsca.
 */
export function GameCard({ game, action }: GameCardProps) {
  const extraCategories = game.categories.length - VISIBLE_CATEGORIES

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft transition-transform duration-300 ease-out hover:scale-[1.02] hover:shadow-ambient">
      <Cover url={game.coverImageUrl} title={game.title} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-headline text-lg font-bold text-on-surface transition-colors group-hover:text-primary">
            <Link
              to={ROUTES.games.detail(game.id)}
              className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-primary focus-visible:before:rounded-2xl"
            >
              {game.title}
            </Link>
          </h3>
          {game.moderationStatus !== 'APPROVED' && (
            <ModerationStatusBadge status={game.moderationStatus} className="shrink-0" />
          )}
        </div>

        <p className="line-clamp-2 text-sm text-on-surface-variant">{game.description}</p>

        {game.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {game.categories.slice(0, VISIBLE_CATEGORIES).map((category) => (
              <Badge key={category.id}>{category.name}</Badge>
            ))}
            {extraCategories > 0 && <Badge>+{extraCategories}</Badge>}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
            <Meta icon="group" title="Liczba graczy">
              {game.minPlayers === game.maxPlayers
                ? game.minPlayers
                : `${game.minPlayers}–${game.maxPlayers}`}
            </Meta>
            <Meta icon="schedule" title="Czas gry">
              {game.playingTimeMinutes} min
            </Meta>
            <Meta icon="cake" title="Wiek gracza">
              {game.minAge}+
            </Meta>
            <Meta icon="calendar_month" title="Rok wydania">
              {game.yearPublished}
            </Meta>
          </div>
          {action && <div className="relative">{action}</div>}
        </div>
      </div>
    </article>
  )
}
