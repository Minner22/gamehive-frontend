import { type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

/** Modal: nakładka + wyśrodkowany panel. ESC i klik w tło zamykają. */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden' // blokuj scroll tła
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-3xl bg-surface-container-low p-6 shadow-ambient',
          className,
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
