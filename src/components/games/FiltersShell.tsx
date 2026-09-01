import type { ReactNode, SubmitEvent } from 'react'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Button, Section, Select } from '@/components/ui'

/**
 * Wspólna oprawa formularzy filtrów: sekcja, siatka pól i para przycisków.
 * Filtry lecą do API dopiero na submit — dzięki temu stuknięcie w pole nie
 * wywołuje zapytania.
 */
interface FiltersShellProps {
  onSubmit: () => void
  onClear: () => void
  children: ReactNode
}

export function FiltersShell({ onSubmit, onClear, children }: Readonly<FiltersShellProps>) {
  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Section title="Filtry">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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

interface TaxonomySelectsProps {
  categories: CategoryDto[]
  mechanics: MechanicDto[]
  categoryId: string
  mechanicId: string
  onCategoryChange: (value: string) => void
  onMechanicChange: (value: string) => void
}

/** Para list słownikowych — jedyne filtry wspólne dla gier i dodatków. */
export function TaxonomySelects({
  categories,
  mechanics,
  categoryId,
  mechanicId,
  onCategoryChange,
  onMechanicChange,
}: Readonly<TaxonomySelectsProps>) {
  return (
    <>
      <Select
        label="Kategoria"
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
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
        value={mechanicId}
        onChange={(e) => onMechanicChange(e.target.value)}
      >
        <option value="">Wszystkie</option>
        {mechanics.map((mechanic) => (
          <option key={mechanic.id} value={mechanic.id}>
            {mechanic.name}
          </option>
        ))}
      </Select>
    </>
  )
}
