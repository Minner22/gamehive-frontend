import { Spinner } from './Spinner'

/** Loader na pełną sekcję trasy (podczas odtwarzania sesji / przejść). */
export function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="text-4xl text-primary" />
    </div>
  )
}
