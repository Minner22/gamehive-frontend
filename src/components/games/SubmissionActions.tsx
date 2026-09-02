import { Button, ButtonLink } from '@/components/ui'

interface SubmissionActionsProps {
  /** Edycja zmienia etykietę zapisu — reszta zachowań jest wspólna. */
  editing: boolean
  /** Zgłoszenie w moderacji albo w bibliotece: zapis zablokowany. */
  locked: boolean
  busy: boolean
  onSubmitToModeration: () => void
  cancelHref: string
}

/**
 * Pasek akcji zgłoszenia: zapis szkicu (submit formularza), wysyłka do moderacji
 * i wyjście. Ten sam układ w zgłoszeniu gry i dodatku — wraz z regułą, że wysyłka
 * to osobna akcja, bo PUT po stronie backendu nie zmienia statusu.
 */
export function SubmissionActions({
  editing,
  locked,
  busy,
  onSubmitToModeration,
  cancelHref,
}: Readonly<SubmissionActionsProps>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" variant="secondary" iconLeft="save" loading={busy} disabled={locked}>
        {editing ? 'Zapisz zmiany' : 'Zapisz szkic'}
      </Button>
      <Button
        type="button"
        iconLeft="send"
        loading={busy}
        disabled={locked}
        onClick={onSubmitToModeration}
      >
        Wyślij do moderacji
      </Button>
      <ButtonLink to={cancelHref} variant="ghost">
        Anuluj
      </ButtonLink>
    </div>
  )
}
