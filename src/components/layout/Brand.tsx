import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

interface BrandProps {
  className?: string
  /** Tylko znak (heksagon), bez wordmarku. */
  iconOnly?: boolean
}

/**
 * Marka GameHive: heksagonalny znak (meeple/ul) + wordmark "Game" (grafit) +
 * "Hive" (złoto). Odwzorowuje referencyjne logo (logo.png).
 */
export function Brand({ className, iconOnly }: BrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="hex-flat grid h-9 w-9 place-items-center bg-gradient-to-br from-primary to-primary-container shadow-glow">
        <Icon name="hive" filled className="text-xl text-on-primary" />
      </span>
      {!iconOnly && (
        <span className="font-headline text-xl font-extrabold tracking-tight">
          <span className="text-on-surface">Game</span>
          <span className="text-primary">Hive</span>
        </span>
      )}
    </span>
  )
}
