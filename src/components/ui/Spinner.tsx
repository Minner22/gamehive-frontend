import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
  label?: string
}

/**
 * Wskaźnik ładowania — animowany pierścień CSS (bez zależności od fontu ikon,
 * więc widoczny od razu). Rozmiar steruj font-size (h/w w `em`), kolor =
 * currentColor; np. `className="text-4xl text-primary"`.
 */
export function Spinner({ className, label = 'Ładowanie…' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block h-[1em] w-[1em] animate-spin rounded-full border-2',
        'border-current border-t-transparent align-[-0.125em]',
        className,
      )}
    />
  )
}
