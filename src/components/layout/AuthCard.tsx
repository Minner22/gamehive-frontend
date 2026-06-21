import type { ReactNode } from 'react'
import { BrandLink } from './BrandLink'
import { Card } from '@/components/ui'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Treść stopki (np. link „Załóż konto"). */
  footer?: ReactNode
}

/** Wspólny szkielet ekranów auth: marka + tytuł + treść + opcjonalna stopka. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <Card className="rounded-[2rem] p-8 shadow-ambient md:p-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandLink iconOnly />
        <h1 className="font-headline text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
      {footer && (
        <div className="mt-8 text-center text-sm text-on-surface-variant">{footer}</div>
      )}
    </Card>
  )
}
