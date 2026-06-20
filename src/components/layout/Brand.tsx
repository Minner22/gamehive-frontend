import { cn } from '@/lib/cn'
import { BrandMark } from './BrandMark'

interface BrandProps {
  className?: string
  /** Tylko znak (heksagon), bez wordmarku. */
  iconOnly?: boolean
  /** Rozmiar znaku w px (domyślnie 36, lub 56 przy iconOnly). */
  size?: number
}

/**
 * Marka GameHive: znak (heksagon + meeple + chevrony) + wordmark "Game" (grafit) +
 * "Hive" (złoto). Odwzorowuje referencyjne logo (logo.png).
 */
export function Brand({ className, iconOnly, size }: BrandProps) {
  const markSize = size ?? (iconOnly ? 56 : 36)

  return (
    <span className={cn('inline-flex items-center gap-2.5 text-on-surface', className)}>
      <BrandMark size={markSize} />
      {!iconOnly && (
        <span className="font-headline text-xl font-extrabold tracking-tight">
          <span>Game</span>
          <span className="text-primary">Hive</span>
        </span>
      )}
    </span>
  )
}
