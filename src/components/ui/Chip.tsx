import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** "Honey-Comb" filter chip — primary-fixed gdy nieaktywny, primary gdy wybrany. */
export function Chip({ selected, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors duration-200',
        selected
          ? 'bg-primary text-on-primary'
          : 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim',
        className,
      )}
      {...rest}
    />
  )
}
