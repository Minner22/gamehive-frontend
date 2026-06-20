import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'gold' | 'success' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  gold: 'bg-primary-fixed text-on-primary-fixed',
  success: 'bg-secondary-container text-on-secondary-container',
  danger: 'bg-error-container text-on-error-container',
  info: 'bg-surface-container-highest text-secondary',
}

/** Mały status-pill (np. stan konta, rola, status gry w kolekcji). */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
