import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Nazwa ikony z Material Symbols Outlined (np. "hive", "dashboard"). */
  name: string
  /** Wariant wypełniony (FILL 1) — np. dla aktywnej nawigacji. */
  filled?: boolean
}

/** Ikona Material Symbols Outlined. Rozmiar i kolor steruj klasami (text-*). */
export function Icon({ name, filled, className, style, ...rest }: IconProps) {
  const variationStyle: CSSProperties | undefined = filled
    ? { fontVariationSettings: "'FILL' 1" }
    : undefined

  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-outlined select-none leading-none', className)}
      style={{ ...variationStyle, ...style }}
      {...rest}
    >
      {name}
    </span>
  )
}
