import { type FormEvent, useState } from 'react'
import type { GameLibraryFilter } from '@/api/games'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Button, Input, Section, Select } from '@/components/ui'

/**
 * Formularz filtrów biblioteki. Trzyma własny „brudnopis" — filtry lecą do API
 * dopiero na submit, więc każde stuknięcie w pole nie odpala zapytania.
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

export function GameFiltersForm({
  initialFilters,
  categories,
  mechanics,
  onApply,
  onClear,
}: GameFiltersFormProps) {
  const [draft, setDraft] = useState<Draft>(() => draftFromFilters(initialFilters))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onApply(draftToFilters(draft))
  }

  return (
    <Section title="Filtry">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Kategoria"
            value={draft.categoryId}
            onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
          >
            <option value="">Wszystkie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Mechanika"
            value={draft.mechanicId}
            onChange={(e) => setDraft((d) => ({ ...d, mechanicId: e.target.value }))}
          >
            <option value="">Wszystkie</option>
            {mechanics.map((mechanic) => (
              <option key={mechanic.id} value={mechanic.id}>
                {mechanic.name}
              </option>
            ))}
          </Select>
          <Input
            label="Liczba graczy"
            type="number"
            min={1}
            inputMode="numeric"
            iconLeft="group"
            hint="gra obsługuje tylu graczy"
            value={draft.players}
            onChange={(e) => setDraft((d) => ({ ...d, players: e.target.value }))}
          />
          <Input
            label="Maksymalny czas gry"
            type="number"
            min={1}
            inputMode="numeric"
            iconLeft="schedule"
            hint="w minutach"
            value={draft.maxPlayingTime}
            onChange={(e) => setDraft((d) => ({ ...d, maxPlayingTime: e.target.value }))}
          />
          <Input
            label="Rok wydania"
            type="number"
            min={1}
            inputMode="numeric"
            iconLeft="calendar_month"
            value={draft.yearPublished}
            onChange={(e) => setDraft((d) => ({ ...d, yearPublished: e.target.value }))}
          />
          <Input
            label="Wiek gracza"
            type="number"
            min={1}
            inputMode="numeric"
            iconLeft="cake"
            hint="gra jest od tego wieku"
            value={draft.age}
            onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" iconLeft="filter_list">
            Filtruj
          </Button>
          <Button type="button" variant="secondary" iconLeft="clear" onClick={onClear}>
            Wyczyść
          </Button>
        </div>
      </form>
    </Section>
  )
}
