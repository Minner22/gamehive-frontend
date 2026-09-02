import type { CategoryDto, MechanicDto } from '@/api/types'
import { Chip } from '@/components/ui'

interface TaxonomyChipsProps {
  legend: string
  options: (CategoryDto | MechanicDto)[]
  value: number[]
  onChange: (ids: number[]) => void
  error?: string
}

/**
 * Wybór wielu pozycji ze słownika przełącznikami. Kategorie i mechaniki są
 * kuratorowane i krótkie, więc lista chipów czyta się lepiej niż multi-select —
 * i tak samo wygląda w zgłoszeniu gry, jak i dodatku.
 */
export function TaxonomyChips({
  legend,
  options,
  value,
  onChange,
  error,
}: Readonly<TaxonomyChipsProps>) {
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((entry) => entry !== id) : [...value, id])

  return (
    <fieldset>
      <legend className="px-1 pb-2 text-sm font-semibold text-on-surface-variant">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.id}
            selected={option.id !== undefined && value.includes(option.id)}
            onClick={() => option.id !== undefined && toggle(option.id)}
          >
            {option.name}
          </Chip>
        ))}
      </div>
      {error && (
        <p role="alert" className="px-1 pt-2 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
