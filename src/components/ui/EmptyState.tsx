import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

interface EmptyStateProps {
  /** Nazwa ikony Material Symbols. */
  icon: string
  title: string
  description?: ReactNode
  /** Wyjście z pustego stanu (np. „Wyczyść filtry"). */
  action?: ReactNode
  className?: string
}

/**
 * Pusty stan listy — ujednolica to, co strony robiły dotąd ad hoc
 * (jednolinijkowy tekst „Brak…"), i zostawia miejsce na akcję wyjścia.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}
      role="status"
    >
      <Icon name={icon} className="text-4xl text-on-surface-variant/60" />
      <p className="font-headline text-lg font-bold text-on-surface">{title}</p>
      {description && <p className="max-w-md text-sm text-on-surface-variant">{description}</p>}
      {action}
    </div>
  )
}
