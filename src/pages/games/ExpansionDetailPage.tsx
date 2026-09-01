import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getExpansion } from '@/api/expansions'
import type { CategoryDto, GameExpansionDto, MechanicDto } from '@/api/types'
import { ModerationStatusBadge } from '@/components/games/ModerationStatusBadge'
import { Badge, Button, ButtonLink, Card, EmptyState, Icon, Section, Spinner } from '@/components/ui'
import { resolveCollection, resolvePlayers, resolveValue, type ValueSource } from '@/lib/expansionValues'
import { useResource } from '@/lib/useResource'
import { ROUTES } from '@/routes/paths'

/** Podpis pod wartością: skąd ona jest. To sedno tego widoku. */
function SourceNote({ inherited }: Readonly<{ inherited: boolean }>) {
  return inherited ? (
    <span className="text-xs text-on-surface-variant">z gry bazowej</span>
  ) : (
    <Badge tone="gold">nadpisane</Badge>
  )
}

function StatTile({
  icon,
  label,
  source,
}: Readonly<{ icon: string; label: string; source: ValueSource<string> }>) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-4 text-center">
      <Icon name={icon} className="text-2xl text-primary" aria-hidden="true" />
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="font-semibold text-on-surface">{source.value}</span>
      <SourceNote inherited={source.inherited} />
    </div>
  )
}

function TaxonomyRow({
  label,
  source,
}: Readonly<{ label: string; source: ValueSource<readonly (CategoryDto | MechanicDto)[]> }>) {
  if (source.value.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-on-surface-variant">{label}:</span>
      {source.value.map((item) => (
        <Badge key={item.id}>{item.name}</Badge>
      ))}
      <SourceNote inherited={source.inherited} />
    </div>
  )
}

function ExpansionDetail({ expansion }: Readonly<{ expansion: GameExpansionDto }>) {
  const players = resolvePlayers(
    expansion.minPlayers,
    expansion.maxPlayers,
    expansion.effectiveMinPlayers,
    expansion.effectiveMaxPlayers,
  )
  const time = resolveValue(expansion.playingTimeMinutes, expansion.effectivePlayingTimeMinutes)
  const age = resolveValue(expansion.minAge, expansion.effectiveMinAge)
  const categories = resolveCollection(expansion.categories, expansion.effectiveCategories)
  const mechanics = resolveCollection(expansion.mechanics, expansion.effectiveMechanics)

  return (
    <div className="space-y-6">
      <ButtonLink to={ROUTES.expansions.library} variant="ghost" size="sm" iconLeft="arrow_back">
        Dodatki
      </ButtonLink>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight">{expansion.name}</h1>
          {expansion.moderationStatus !== 'APPROVED' && (
            <ModerationStatusBadge status={expansion.moderationStatus} />
          )}
        </div>
        <p className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
          <Icon name="extension" className="text-base" aria-hidden="true" />
          Dodatek do gry:
          <Link
            to={ROUTES.games.detail(expansion.baseGameId)}
            className="font-semibold text-primary hover:underline"
          >
            {expansion.baseGameTitle}
          </Link>
        </p>
        <p className="leading-relaxed text-on-surface-variant">{expansion.description}</p>
      </header>

      {expansion.moderationStatus === 'REJECTED' && expansion.rejectionReason && (
        <Card className="bg-error-container">
          <p className="text-sm font-bold text-on-error-container">Powód odrzucenia</p>
          <p className="mt-1 text-sm text-on-error-container">{expansion.rejectionReason}</p>
        </Card>
      )}

      <Section title="Jak się w to gra">
        <p className="mb-4 text-sm text-on-surface-variant">
          Wartości puste po stronie dodatku pochodzą z gry bazowej — poniżej widać, które dodatek
          zmienia, a które przejmuje.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile icon="group" label="Gracze" source={players} />
          <StatTile
            icon="schedule"
            label="Czas"
            source={{ value: `${time.value} min`, inherited: time.inherited }}
          />
          <StatTile
            icon="cake"
            label="Wiek"
            source={{ value: `${age.value}+`, inherited: age.inherited }}
          />
        </div>
        <div className="mt-4 space-y-3">
          <TaxonomyRow label="Kategorie" source={categories} />
          <TaxonomyRow label="Mechaniki" source={mechanics} />
        </div>
      </Section>
    </div>
  )
}

export default function ExpansionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const expansionId = Number(id)
  const valid = Number.isInteger(expansionId) && expansionId > 0

  const fetchExpansion = useCallback(() => getExpansion(expansionId), [expansionId])
  const { state, reload } = useResource(fetchExpansion)

  if (!valid || state.status === 'notFound') {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono dodatku"
        description="Dodatek o tym adresie nie istnieje albo został usunięty z biblioteki."
        action={
          <ButtonLink to={ROUTES.expansions.library} variant="secondary" iconLeft="arrow_back">
            Wróć do dodatków
          </ButtonLink>
        }
      />
    )
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        icon="cloud_off"
        title="Nie udało się wczytać dodatku"
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
        <Spinner className="text-3xl text-primary" label="Ładowanie dodatku…" />
      </div>
    )
  }

  return <ExpansionDetail expansion={state.data} />
}
