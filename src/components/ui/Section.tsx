import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

interface SectionProps {
  title: string
  /** Element po prawej stronie nagłówka (np. badge, przycisk). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Karta-sekcja z nagłówkiem (tytuł + opcjonalna akcja). Wnętrze dowolne. */
export function Section({ title, action, className, children }: SectionProps) {
  return (
    <Card className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-headline text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}
