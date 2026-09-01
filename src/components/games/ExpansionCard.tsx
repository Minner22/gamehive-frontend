import type { ReactNode } from 'react'
import type { GameExpansionDto } from '@/api/types'
import { Badge, Icon } from '@/components/ui'
import { ModerationStatusBadge } from './ModerationStatusBadge'

/**
 * Kafelek dodatku. Pokazuje wartości **efektywne** (własne albo odziedziczone
 * z gry bazowej) — czyli to, jak dodatek gra się w praktyce.
 *
 * Dodatek nie ma okładki ani roku wydania (nie ma ich w modelu), więc kafelek
 * jest tekstowy, a nie kopią `GameCard`. Wyróżnienie „to nadpisanie, a to
 * dziedziczenie" wchodzi razem z widokiem dodatków (GH-47).
 */
interface ExpansionCardProps {
  expansion: GameExpansionDto
  /** Akcja w stopce (np. „Dodaj do kolekcji" — GH-48). */
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

export function ExpansionCard({ expansion, action }: ExpansionCardProps) {
  const players =
    expansion.effectiveMinPlayers === expansion.effectiveMaxPlayers
      ? String(expansion.effectiveMinPlayers)
      : `${expansion.effectiveMinPlayers}–${expansion.effectiveMaxPlayers}`

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-base font-bold text-on-surface">{expansion.name}</h3>
        {expansion.moderationStatus !== 'APPROVED' && (
          <ModerationStatusBadge status={expansion.moderationStatus} className="shrink-0" />
        )}
      </div>

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
        {action}
      </div>
    </article>
  )
}
