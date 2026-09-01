import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { GameExpansionDto } from '@/api/types'
import { Badge, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'
import { ModerationStatusBadge } from './ModerationStatusBadge'

/**
 * Kafelek dodatku. Pokazuje wartości **efektywne** (własne albo odziedziczone
 * z gry bazowej) — czyli to, jak dodatek gra się w praktyce.
 *
 * Dodatek nie ma okładki ani roku wydania (nie ma ich w modelu), więc kafelek
 * jest tekstowy, a nie kopią `GameCard`. Rozróżnienie „to nadpisanie, a to
 * dziedziczenie" pokazuje dopiero strona szczegółów — w siatce liczy się to,
 * jak dodatek gra się w praktyce, czyli wartości efektywne.
 */
interface ExpansionCardProps {
  expansion: GameExpansionDto
  /** Akcja w stopce (np. „Dodaj do kolekcji" — GH-48). */
  action?: ReactNode
  /**
   * Pokaż grę bazową. Na stronie gry byłaby to oczywistość, ale w wynikach
   * wyszukiwania to jedyna informacja, czego właściwie dotyczy dodatek.
   */
  showBaseGame?: boolean
}

function Meta({ icon, children, title }: { icon: string; children: ReactNode; title: string }) {
  return (
    <span className="flex items-center gap-1" title={title}>
      <Icon name={icon} className="text-base" aria-hidden="true" />
      {children}
    </span>
  )
}

export function ExpansionCard({
  expansion,
  action,
  showBaseGame,
}: Readonly<ExpansionCardProps>) {
  const players =
    expansion.effectiveMinPlayers === expansion.effectiveMaxPlayers
      ? String(expansion.effectiveMinPlayers)
      : `${expansion.effectiveMinPlayers}–${expansion.effectiveMaxPlayers}`

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4 transition-transform duration-300 ease-out hover:scale-[1.02]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-base font-bold text-on-surface transition-colors group-hover:text-primary">
          <Link
            to={ROUTES.expansions.detail(expansion.id)}
            className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:before:rounded-2xl focus-visible:before:ring-2 focus-visible:before:ring-primary"
          >
            {expansion.name}
          </Link>
        </h3>
        {expansion.moderationStatus !== 'APPROVED' && (
          <ModerationStatusBadge status={expansion.moderationStatus} className="shrink-0" />
        )}
      </div>

      {showBaseGame && (
        <p className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Icon name="extension" className="text-sm" aria-hidden="true" />
          Dodatek do: <span className="font-semibold">{expansion.baseGameTitle}</span>
        </p>
      )}

      <p className="line-clamp-3 text-sm text-on-surface-variant">{expansion.description}</p>

      {expansion.effectiveCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expansion.effectiveCategories.slice(0, 2).map((category) => (
            <Badge key={category.id}>{category.name}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
          <Meta icon="group" title="Liczba graczy (po uwzględnieniu gry bazowej)">
            {players}
          </Meta>
          <Meta icon="schedule" title="Czas gry (po uwzględnieniu gry bazowej)">
            {expansion.effectivePlayingTimeMinutes} min
          </Meta>
          <Meta icon="cake" title="Wiek gracza (po uwzględnieniu gry bazowej)">
            {expansion.effectiveMinAge}+
          </Meta>
        </div>
        {action && <div className="relative">{action}</div>}
      </div>
    </article>
  )
}
