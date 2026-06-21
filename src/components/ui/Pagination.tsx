import { Button } from './Button'

interface PaginationProps {
  /** Numer bieżącej strony (0-based, jak w Spring Page). */
  number: number
  totalPages: number
  totalElements: number
  isFirst: boolean
  isLast: boolean
  /** Blokada przycisków (np. podczas ładowania). */
  disabled?: boolean
  onChange: (page: number) => void
  /** Rzeczownik liczony, np. „użytkownik(ów)" / „wpis(ów)". */
  unit: string
}

/** Pasek stronicowania pod listą (licznik + Poprzednia/Następna). */
export function Pagination({
  number,
  totalPages,
  totalElements,
  isFirst,
  isLast,
  disabled,
  onChange,
  unit,
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-sm text-on-surface-variant">
        {totalElements} {unit} · strona {number + 1} z {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          iconLeft="chevron_left"
          disabled={isFirst || disabled}
          onClick={() => onChange(number - 1)}
        >
          Poprzednia
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron_right"
          disabled={isLast || disabled}
          onClick={() => onChange(number + 1)}
        >
          Następna
        </Button>
      </div>
    </div>
  )
}
