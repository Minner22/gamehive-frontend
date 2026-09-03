import { useState } from 'react'
import type { ModerationStatus } from '@/api/types'
import { Button, ButtonLink, Card, Icon } from '@/components/ui'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError'
import { isSubmissionEditable, isSubmittable, STATUS_HINT } from '@/lib/moderationStatus'
import { ModerationStatusBadge } from './ModerationStatusBadge'

/**
 * Zgłoszenie w widoku autora — wspólne dla gier i dodatków, bo obie encje mają ten
 * sam przepływ moderacji i różnią się tylko nazwą pola z tytułem oraz endpointem
 * wysyłki. Strona podaje jedno i drugie w `entry`.
 */
export interface SubmissionEntry {
  id: number
  name: string
  status: ModerationStatus
  rejectionReason?: string
  detailHref: string
  editHref: string
  /** Wysyłka do moderacji; zwraca nowy status pozycji. */
  submit: () => Promise<ModerationStatus>
}

interface SubmissionCardProps {
  entry: SubmissionEntry
  /** Wywoływane po udanej wysyłce — strona podmienia status na liście. */
  onSubmitted: (status: ModerationStatus) => void
}

export function SubmissionCard({ entry, onSubmitted }: Readonly<SubmissionCardProps>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      onSubmitted(await entry.submit())
    } catch (err) {
      // Limit poprawek wyczerpany: stan zgłoszenia zostaje bez zmian, a odblokować
      // je może wyłącznie moderator — komunikat musi to powiedzieć wprost.
      setError(
        getApiErrorCode(err) === 'RESUBMISSION_LIMIT_EXCEEDED'
          ? 'Wyczerpano limit poprawek — o odblokowanie zgłoszenia poproś moderatora.'
          : getApiErrorMessage(err),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-lg font-bold text-on-surface">{entry.name}</h3>
        <ModerationStatusBadge status={entry.status} className="shrink-0" />
      </div>

      <p className="text-sm text-on-surface-variant">{STATUS_HINT[entry.status]}</p>

      {entry.status === 'REJECTED' && entry.rejectionReason && (
        <div className="rounded-2xl bg-error-container p-3">
          <p className="text-xs font-bold text-on-error-container">Powód odrzucenia</p>
          <p className="mt-1 text-sm text-on-error-container">{entry.rejectionReason}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-1 text-sm font-medium text-error">
          <Icon name="error" className="text-base" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink to={entry.detailHref} size="sm" variant="ghost" iconLeft="visibility">
          Podgląd
        </ButtonLink>
        {isSubmissionEditable(entry.status) && (
          <ButtonLink to={entry.editHref} size="sm" variant="secondary" iconLeft="edit">
            Edytuj
          </ButtonLink>
        )}
        {isSubmittable(entry.status) && (
          <Button size="sm" iconLeft="send" loading={busy} onClick={send}>
            Wyślij do moderacji
          </Button>
        )}
      </div>
    </Card>
  )
}
