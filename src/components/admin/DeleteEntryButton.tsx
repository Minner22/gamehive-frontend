import { useState } from 'react'
import { Button } from '@/components/ui'
import { taxonomyErrorMessage } from '@/lib/taxonomyErrors'

interface DeleteEntryButtonProps {
  name: string
  /** Rzuca przy błędzie — np. 409 `*_IN_USE`, gdy pozycja jest przypięta do treści. */
  onDelete: () => Promise<void>
}

/**
 * Usunięcie wpisu słownika z potwierdzeniem w miejscu. Pełne okno dialogowe byłoby
 * tu przesadą: skutek dotyczy jednej nazwy, a backend i tak blokuje usunięcie
 * pozycji używanej przez grę lub dodatek.
 */
export function DeleteEntryButton({ name, onDelete }: Readonly<DeleteEntryButtonProps>) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setError(taxonomyErrorMessage(err))
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  if (!confirming) {
    return (
      <span className="flex flex-col items-end gap-1">
        <Button size="sm" variant="ghost" iconLeft="delete" onClick={() => setConfirming(true)}>
          Usuń
        </Button>
        {error && (
          <span role="alert" className="max-w-xs text-right text-xs font-medium text-error">
            {error}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-on-surface-variant">Usunąć „{name}"?</span>
      <Button size="sm" variant="danger" loading={busy} onClick={() => void confirm()}>
        Tak, usuń
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
        Nie
      </Button>
    </span>
  )
}
