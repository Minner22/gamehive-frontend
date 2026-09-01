import { useState } from 'react'
import type { ExpansionLibraryFilter } from '@/api/expansions'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { FiltersShell, TaxonomySelects } from './FiltersShell'

/**
 * Filtry biblioteki dodatków — węższe niż w grach, bo backend przyjmuje tu tylko
 * `baseGameId`, `categoryId` i `mechanicId` (liczba graczy czy czas dotyczyłyby
 * wartości efektywnych, co świadomie oddano wyszukiwarce).
 *
 * `baseGameId` nie ma własnej kontrolki — wybór gry wymaga pickera z GH-50 —
 * ale przechodzi przez formularz nietknięty, bo przychodzi z adresu (link
 * „wszystkie dodatki do tej gry"). Stan startowy odtwarza `key` na komponencie.
 */
interface ExpansionFiltersFormProps {
  initialFilters: ExpansionLibraryFilter
  categories: CategoryDto[]
  mechanics: MechanicDto[]
  onApply: (filters: ExpansionLibraryFilter) => void
  onClear: () => void
}

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
  const [draft, setDraft] = useState({
    categoryId: initialFilters.categoryId ? String(initialFilters.categoryId) : '',
    mechanicId: initialFilters.mechanicId ? String(initialFilters.mechanicId) : '',
  })

  return (
    <FiltersShell
      onClear={onClear}
      onSubmit={() =>
        onApply({
          baseGameId: initialFilters.baseGameId,
          categoryId: toNumber(draft.categoryId),
          mechanicId: toNumber(draft.mechanicId),
        })
      }
    >
      <TaxonomySelects
        categories={categories}
        mechanics={mechanics}
        categoryId={draft.categoryId}
        mechanicId={draft.mechanicId}
        onCategoryChange={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
        onMechanicChange={(mechanicId) => setDraft((d) => ({ ...d, mechanicId }))}
      />
    </FiltersShell>
  )
}
