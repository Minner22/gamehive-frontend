import { useState } from 'react'
import type { GameLibraryFilter } from '@/api/games'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Input } from '@/components/ui'
import { FiltersShell, TaxonomySelects } from './FiltersShell'

/**
 * Filtry biblioteki gier. Trzyma własny „brudnopis" — filtry lecą do API dopiero
 * na submit, więc każde stuknięcie w pole nie odpala zapytania.
 *
 * Stan startowy bierze z `initialFilters`. Odtworzenie formularza po zmianie
 * adresu (przycisk „wstecz") robi się przez `key` na tym komponencie — nadpisywanie
 * stanu efektem byłoby synchronizacją stanu ze stanem.
 */
interface GameFiltersFormProps {
  initialFilters: GameLibraryFilter
  categories: CategoryDto[]
  mechanics: MechanicDto[]
  onApply: (filters: GameLibraryFilter) => void
  onClear: () => void
}

type Draft = {
  categoryId: string
  mechanicId: string
  players: string
  maxPlayingTime: string
  yearPublished: string
  age: string
}

function draftFromFilters(filters: GameLibraryFilter): Draft {
  const text = (value: number | undefined) => (value === undefined ? '' : String(value))
  return {
    categoryId: text(filters.categoryId),
    mechanicId: text(filters.mechanicId),
    players: text(filters.players),
    maxPlayingTime: text(filters.maxPlayingTime),
    yearPublished: text(filters.yearPublished),
    age: text(filters.age),
  }
}

/** Puste i niepoprawne pola nie stają się filtrem — API ma dostać tylko sensowne wartości. */
function draftToFilters(draft: Draft): GameLibraryFilter {
  const number = (value: string) => {
    const parsed = Number(value)
    return value.trim() !== '' && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
  return {
    categoryId: number(draft.categoryId),
    mechanicId: number(draft.mechanicId),
    players: number(draft.players),
    maxPlayingTime: number(draft.maxPlayingTime),
    yearPublished: number(draft.yearPublished),
    age: number(draft.age),
  }
}

/** Pola liczbowe biblioteki — wszystkie mają ten sam kształt, różnią się opisem. */
const NUMBER_FIELDS: { key: keyof Draft; label: string; icon: string; hint?: string }[] = [
  { key: 'players', label: 'Liczba graczy', icon: 'group', hint: 'gra obsługuje tylu graczy' },
  { key: 'maxPlayingTime', label: 'Maksymalny czas gry', icon: 'schedule', hint: 'w minutach' },
  { key: 'yearPublished', label: 'Rok wydania', icon: 'calendar_month' },
  { key: 'age', label: 'Wiek gracza', icon: 'cake', hint: 'gra jest od tego wieku' },
]

export function GameFiltersForm({
  initialFilters,
  categories,
  mechanics,
  onApply,
  onClear,
}: Readonly<GameFiltersFormProps>) {
  const [draft, setDraft] = useState<Draft>(() => draftFromFilters(initialFilters))

  return (
    <FiltersShell onClear={onClear} onSubmit={() => onApply(draftToFilters(draft))}>
      <TaxonomySelects
        categories={categories}
        mechanics={mechanics}
        categoryId={draft.categoryId}
        mechanicId={draft.mechanicId}
        onCategoryChange={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
        onMechanicChange={(mechanicId) => setDraft((d) => ({ ...d, mechanicId }))}
      />
      {NUMBER_FIELDS.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          type="number"
          min={1}
          inputMode="numeric"
          iconLeft={field.icon}
          hint={field.hint}
          value={draft[field.key]}
          onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
        />
      ))}
    </FiltersShell>
  )
}
