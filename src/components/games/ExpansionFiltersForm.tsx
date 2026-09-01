import { type FormEvent, useState } from 'react'
import type { ExpansionLibraryFilter } from '@/api/expansions'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Button, Section, Select } from '@/components/ui'

/**
 * Filtry biblioteki dodatków — węższe niż w grach, bo backend przyjmuje tu tylko
 * `baseGameId`, `categoryId` i `mechanicId` (liczba graczy czy czas dotyczyłyby
 * wartości efektywnych, co świadomie oddano wyszukiwarce).
 *
 * `baseGameId` nie ma własnej kontrolki — wybór gry wymaga podpowiedzi, czyli
 * pickera z GH-50; przychodzi natomiast z adresu, np. z linku „wszystkie dodatki
 * do tej gry". Stan startowy odtwarza się przez `key` na komponencie.
 */
interface ExpansionFiltersFormProps {
  initialFilters: ExpansionLibraryFilter
  categories: CategoryDto[]
  mechanics: MechanicDto[]
  onApply: (filters: ExpansionLibraryFilter) => void
  onClear: () => void
}

type Draft = { categoryId: string; mechanicId: string }

function toNumber(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() !== '' && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function ExpansionFiltersForm({
  initialFilters,
  categories,
  mechanics,
  onApply,
  onClear,
}: Readonly<ExpansionFiltersFormProps>) {
  const [draft, setDraft] = useState<Draft>(() => ({
    categoryId: initialFilters.categoryId ? String(initialFilters.categoryId) : '',
    mechanicId: initialFilters.mechanicId ? String(initialFilters.mechanicId) : '',
  }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onApply({
      baseGameId: initialFilters.baseGameId,
      categoryId: toNumber(draft.categoryId),
      mechanicId: toNumber(draft.mechanicId),
    })
  }

  return (
    <Section title="Filtry">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
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
