import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Interaktywna karta — unosi się (scale + cień) na hover. */
  interactive?: boolean
}

/**
 * "The Vault" card — powierzchnia surface-container-lowest na tle surface,
 * separacja tonalna (bez obrysu 1px) + miękki cień.
 */
export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface-container-lowest p-6 shadow-soft',
        interactive &&
          'cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-ambient',
        className,
      )}
      {...rest}
    />
  )
}
