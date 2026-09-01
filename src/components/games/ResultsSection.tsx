import type { ReactNode } from 'react'
import type { Page } from '@/api/types'
import { Button, EmptyState, ListSkeleton, Pagination } from '@/components/ui'

/**
 * Cztery stany listy stronicowanej: ładowanie, błąd, pusto i wyniki.
 * Biblioteki gier i dodatków miały ten sam układ przepisany dwa razy — teksty
 * i kafelki różnią się między nimi, sam szkielet nie.
 */
interface ResultsSectionProps<T> {
  data: Page<T> | null
  loading: boolean
  onReload: () => void
  onPageChange: (page: number) => void
  /** Komunikat dla czytników ekranu przy pierwszym ładowaniu. */
  loadingLabel: string
  errorTitle: string
  /** Gotowy pusty stan — teksty i akcja wyjścia należą do konkretnego widoku. */
  empty: ReactNode
  /** Rzeczownik liczony w pasku stronicowania (już odmieniony). */
  unit: string
  skeletonCount?: number
  skeletonClassName?: string
  /** Dodatkowa treść między siatką a stronicowaniem (np. informacja o sufcie trafień). */
  footer?: ReactNode
  children: (item: T) => ReactNode
}

export function ResultsSection<T>({
  data,
  loading,
  onReload,
  onPageChange,
  loadingLabel,
  errorTitle,
  empty,
  unit,
  skeletonCount = 6,
  skeletonClassName,
  footer,
  children,
}: Readonly<ResultsSectionProps<T>>) {
  if (!data) {
    if (!loading) {
      return (
        <EmptyState
          icon="cloud_off"
          title={errorTitle}
          description="Sprawdź połączenie i spróbuj ponownie."
          action={
            <Button variant="secondary" iconLeft="refresh" onClick={onReload}>
              Spróbuj ponownie
            </Button>
          }
        />
      )
    }
    return (
      <>
        <output className="sr-only">{loadingLabel}</output>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          <ListSkeleton count={skeletonCount} className={skeletonClassName} />
        </div>
      </>
    )
  }

  if (data.empty) return <>{empty}</>

  return (
    <div className="space-y-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
        {data.content.map((item) => children(item))}
      </div>
      {footer}
      <Pagination
        number={data.number}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        isFirst={data.first}
        isLast={data.last}
        disabled={loading}
        onChange={onPageChange}
        unit={unit}
      />
    </div>
  )
}
