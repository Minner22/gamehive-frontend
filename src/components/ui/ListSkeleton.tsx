import { cn } from '@/lib/cn'

interface ListSkeletonProps {
  /** Ile placeholderów wyrenderować (zwykle tyle, ile pozycji na stronie). */
  count?: number
  /** Wysokość pojedynczego placeholdera — dopasuj do docelowej karty/wiersza. */
  className?: string
}

/**
 * Szkielet listy na czas pierwszego ładowania. Placeholdery są `aria-hidden` —
 * komunikat dla czytników ekranu należy do kontenera listy (`aria-busy`
 * i `role="status"`), żeby nie czytać sześciu pustych bloków.
 */
export function ListSkeleton({ count = 6, className }: ListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn('h-72 animate-pulse rounded-2xl bg-surface-container-low', className)}
        />
      ))}
    </>
  )
}
