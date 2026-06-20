import { cn } from '@/lib/cn'
import { Icon } from './Icon'

interface SpinnerProps {
  className?: string
  label?: string
}

/** Wskaźnik ładowania (obracająca się ikona Material Symbols). */
export function Spinner({ className, label = 'Ładowanie…' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Icon name="progress_activity" className={cn('animate-spin text-primary', className)} />
    </span>
  )
}
