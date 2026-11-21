import { useState } from 'react'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Input } from '@/components/ui'
import {
  isFilterApplicable,
  type CatalogFilterKey,
  type CatalogFilters,
  type CatalogType,
} from '@/lib/catalog'
import { FiltersShell, TaxonomySelects } from './FiltersShell'

/**
 * Filtry katalogu — jeden formularz dla wszystkich zakładek. Pola, które w danej
 * zakładce nie mają sensu (rok wydania przy dodatkach), są ukryte.
 *
 * Trzyma własny „brudnopis”: filtry lecą do API dopiero na submit, więc stuknięcie
 * w pole nie odpala zapytania. Odtworzenie formularza po zmianie adresu („wstecz”)
 * robi się przez `key` na komponencie — nie efektem synchronizującym stan.
 *
 * Filtry bez kontrolek (`authorId`, `baseGameId`) przychodzą z linków i przechodzą
 * przez formularz nietknięte.
 */
interface CatalogFiltersFormProps {
  type: CatalogType
  initialFilters: CatalogFilters
  categories: CategoryDto[]
  mechanics: MechanicDto[]
  onApply: (filters: CatalogFilters) => void
  onClear: () => void
}

type EditableKey = Exclude<CatalogFilterKey, 'authorId' | 'baseGameId'>
type Draft = Record<EditableKey, string>

const EDITABLE_KEYS: EditableKey[] = [
  'categoryId',
  'mechanicId',
  'players',
  'maxPlayingTime',
  'yearPublished',
  'age',
]

const NUMBER_FIELDS: { key: EditableKey; label: string; icon: string; hint?: string }[] = [
  { key: 'players', label: 'Liczba graczy', icon: 'group', hint: 'pozycja obsługuje tylu graczy' },
  { key: 'maxPlayingTime', label: 'Maksymalny czas gry', icon: 'schedule', hint: 'w minutach' },
  { key: 'yearPublished', label: 'Rok wydania', icon: 'calendar_month' },
  { key: 'age', label: 'Wiek gracza', icon: 'cake', hint: 'pozycja jest od tego wieku' },
]

function draftFromFilters(filters: CatalogFilters): Draft {
  const draft = {} as Draft
  for (const key of EDITABLE_KEYS) draft[key] = filters[key] === undefined ? '' : String(filters[key])
  return draft
}

/** Puste i niepoprawne pola nie stają się filtrem — API dostaje tylko sensowne wartości. */
function toNumber(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() !== '' && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function CatalogFiltersForm({
  type,
  initialFilters,
  categories,
  mechanics,
  onApply,
  onClear,
}: Readonly<CatalogFiltersFormProps>) {
  const [draft, setDraft] = useState<Draft>(() => draftFromFilters(initialFilters))

  const submit = () => {
    const next: CatalogFilters = {
      authorId: initialFilters.authorId,
      baseGameId: initialFilters.baseGameId,
    }
    for (const key of EDITABLE_KEYS) next[key] = toNumber(draft[key])
    onApply(next)
  }

  const yearOnlyForGames = type === 'all'

  return (
    <FiltersShell onClear={onClear} onSubmit={submit}>
      <TaxonomySelects
        categories={categories}
        mechanics={mechanics}
        categoryId={draft.categoryId}
        mechanicId={draft.mechanicId}
        onCategoryChange={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
        onMechanicChange={(mechanicId) => setDraft((d) => ({ ...d, mechanicId }))}
      />
      {NUMBER_FIELDS.filter((field) => isFilterApplicable(type, field.key)).map((field) => (
        <Input
          key={field.key}
          label={field.label}
          type="number"
          min={1}
          inputMode="numeric"
          iconLeft={field.icon}
          hint={field.key === 'yearPublished' && yearOnlyForGames ? 'dopasuje tylko gry' : field.hint}
          value={draft[field.key]}
          onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
        />
      ))}
    </FiltersShell>
  )
}
