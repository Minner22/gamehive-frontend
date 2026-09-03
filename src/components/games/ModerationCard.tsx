import { type ReactNode, useState } from 'react'
import type { ModerationStatus } from '@/api/types'
import { Badge, Button, ButtonLink, Card, Dialog, Icon, Textarea } from '@/components/ui'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError'
import { ModerationStatusBadge } from './ModerationStatusBadge'

/**
 * Zgłoszenie w widoku moderatora — wspólne dla gier i dodatków, bo decyzje
 * i ich reguły są identyczne. Strona podaje dane do pokazania (`details`)
 * oraz trzy akcje, każda uderzająca we własny endpoint.
 */
export interface ModerationEntry {
  id: number
  name: string
  /** Kto zgłosił (identyfikator z backendu — DTO nie niesie nazwy użytkownika). */
  submittedBy: string
  resubmissionCount: number
  detailHref: string
  details: ReactNode
  approve: () => Promise<ModerationStatus>
  reject: (reason: string) => Promise<ModerationStatus>
  unlock: () => Promise<ModerationStatus>
}

interface ModerationCardProps {
  entry: ModerationEntry
  /** Status po decyzji — `undefined`, dopóki zgłoszenie czeka w kolejce. */
  decidedAs?: ModerationStatus
  onDecided: (status: ModerationStatus) => void
}

const DECISION_NOTE: Partial<Record<ModerationStatus, string>> = {
  APPROVED: 'Zatwierdzone — pozycja jest już w bibliotece.',
  REJECTED: 'Odrzucone. Autor może poprawić zgłoszenie i wysłać je ponownie.',
  DRAFT: 'Odblokowane — wróciło do autora jako szkic, licznik poprawek wyzerowany.',
}

export function ModerationCard({ entry, decidedAs, onDecided }: Readonly<ModerationCardProps>) {
  const [busy, setBusy] = useState<'approve' | 'reject' | 'unlock' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  /** Jedna ścieżka dla wszystkich decyzji: blokada przycisków, błąd przy karcie. */
  const run = async (key: 'approve' | 'reject' | 'unlock', action: () => Promise<ModerationStatus>) => {
    setBusy(key)
    setError(null)
    try {
      onDecided(await action())
      setRejecting(false)
    } catch (err) {
      const code = getApiErrorCode(err)
      setError(
        code === 'GAME_NOT_PENDING' || code === 'EXPANSION_NOT_PENDING'
          ? 'Ktoś już podjął decyzję w tym zgłoszeniu — odśwież listę.'
          : getApiErrorMessage(err),
      )
    } finally {
      setBusy(null)
    }
  }

  const confirmReject = () => {
    // Backend odrzuca pusty powód (400 REJECTION_REASON_REQUIRED) — sprawdzamy wcześniej,
    // bo autor bez uzasadnienia i tak nie wie, co poprawić.
    if (reason.trim().length === 0) {
      setReasonError('Podaj powód odrzucenia — trafi do autora zgłoszenia')
      return
    }
    setReasonError(null)
    void run('reject', () => entry.reject(reason.trim()))
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-lg font-bold text-on-surface">{entry.name}</h3>
        {decidedAs ? (
          <ModerationStatusBadge status={decidedAs} className="shrink-0" />
        ) : (
          <Badge tone="info">Czeka na decyzję</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1" title="Autor zgłoszenia">
          <Icon name="person" className="text-sm" aria-hidden="true" />
          {entry.submittedBy}
        </span>
        {entry.resubmissionCount > 0 && (
          <span className="flex items-center gap-1" title="Liczba poprawek autora">
            <Icon name="history" className="text-sm" aria-hidden="true" />
            poprawki: {entry.resubmissionCount}
          </span>
        )}
      </div>

      {entry.details}

      {decidedAs && (
        <p className="text-sm text-on-surface-variant">{DECISION_NOTE[decidedAs]}</p>
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

        {!decidedAs && (
          <>
            <Button
              size="sm"
              iconLeft="check"
              loading={busy === 'approve'}
              onClick={() => void run('approve', entry.approve)}
            >
              Zatwierdź
            </Button>
            <Button
              size="sm"
              variant="danger"
              iconLeft="close"
              disabled={busy !== null}
              onClick={() => setRejecting(true)}
            >
              Odrzuć
            </Button>
          </>
        )}

        {/*
          Odblokowanie ma sens tylko dla zgłoszenia odrzuconego, a backend nie
          wystawia listy odrzuconych — jedyny moment, gdy moderator ma je pod ręką,
          to chwila zaraz po własnej decyzji.
        */}
        {decidedAs === 'REJECTED' && (
          <Button
            size="sm"
            variant="secondary"
            iconLeft="lock_open"
            loading={busy === 'unlock'}
            onClick={() => void run('unlock', entry.unlock)}
          >
            Odblokuj autorowi
          </Button>
        )}
      </div>

      <Dialog open={rejecting} onClose={() => setRejecting(false)} title="Odrzuć zgłoszenie">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Powód trafi do autora — napisz, co trzeba poprawić.
          </p>
          <Textarea
            label="Powód odrzucenia"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reasonError ?? undefined}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Anuluj
            </Button>
            <Button variant="danger" loading={busy === 'reject'} onClick={confirmReject}>
              Odrzuć zgłoszenie
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}
