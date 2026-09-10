import { type ReactNode, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  approveExpansion,
  listModerationExpansions,
  rejectExpansion,
  unlockExpansion,
} from '@/api/moderation'
import type { GameExpansionModerationDto, ModerationQueueStatus } from '@/api/types'
import { ModerationQueue } from '@/components/games/ModerationQueue'
import { SourceNote } from '@/components/games/SourceNote'
import { Badge, Icon } from '@/components/ui'
import { resolveCollection, resolvePlayers, resolveValue } from '@/lib/expansionValues'
import { ROUTES } from '@/routes/paths'

function ValueRow({
  icon,
  label,
  value,
  inherited,
}: Readonly<{ icon: string; label: string; value: ReactNode; inherited: boolean }>) {
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <Icon name={icon} className="text-base" aria-hidden="true" />
      <span className="sr-only">{label}:</span>
      {value}
      <SourceNote inherited={inherited} />
    </span>
  )
}

/**
 * Moderator ocenia dodatek w zestawieniu z grą bazową: które wartości zmienia,
 * a które przejmuje. Zatwierdzenie dodatku — inaczej niż gry — nie zatwierdza
 * żadnej taksonomii, bo dodatek nie ma własnych wydawców ani autorów.
 */
function ExpansionDetails({ expansion }: Readonly<{ expansion: GameExpansionModerationDto }>) {
  const players = resolvePlayers(
    expansion.minPlayers,
    expansion.maxPlayers,
    expansion.effectiveMinPlayers,
    expansion.effectiveMaxPlayers,
  )
  const time = resolveValue(expansion.playingTimeMinutes, expansion.effectivePlayingTimeMinutes)
  const age = resolveValue(expansion.minAge, expansion.effectiveMinAge)
  const categories = resolveCollection(expansion.categories, expansion.effectiveCategories)

  return (
    <div className="space-y-3">
      {/* Gra bazowa jest zawsze APPROVED (backend tego pilnuje), więc link działa każdemu. */}
      <p className="flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
        <Icon name="extension" className="text-base" aria-hidden="true" />
        Dodatek do gry:
        <Link
          to={ROUTES.games.detail(expansion.baseGameId)}
          className="font-semibold text-primary hover:underline"
        >
          {expansion.baseGameTitle}
        </Link>
      </p>

      <p className="whitespace-pre-line text-sm text-on-surface-variant">
        {expansion.description}
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
        <ValueRow
          icon="group"
          label="Liczba graczy"
          value={players.value}
          inherited={players.inherited}
        />
        <ValueRow
          icon="schedule"
          label="Czas gry"
          value={`${time.value} min`}
          inherited={time.inherited}
        />
        <ValueRow icon="cake" label="Wiek gracza" value={`${age.value}+`} inherited={age.inherited} />
      </div>

      {categories.value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.value.map((category) => (
            <Badge key={category.id} tone="info">
              {category.name}
            </Badge>
          ))}
          <SourceNote inherited={categories.inherited} />
        </div>
      )}
    </div>
  )
}

export default function ExpansionModerationPage() {
  const fetchPage = useCallback(
    (status: ModerationQueueStatus, page: number, size: number) =>
      listModerationExpansions(status, { page, size }),
    [],
  )

  return (
    <ModerationQueue
      title="Moderacja: zgłoszenia dodatków"
      description="Zatwierdzenie dodaje dodatek do biblioteki. W przeciwieństwie do gry nie zatwierdza żadnej taksonomii — dodatek jej nie wnosi."
      subjectGenitive="dodatku"
      fetchPage={fetchPage}
      toEntry={(expansion) => ({
        id: expansion.id,
        name: expansion.name,
        submittedBy: expansion.submittedBy,
        resubmissionCount: expansion.resubmissionCount,
        details: <ExpansionDetails expansion={expansion} />,
        approve: async () => (await approveExpansion(expansion.id)).moderationStatus,
        reject: async (reason) =>
          (await rejectExpansion(expansion.id, { reason })).moderationStatus,
        unlock: async () => (await unlockExpansion(expansion.id)).moderationStatus,
      })}
    />
  )
}
