import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button, ButtonLink, Card, Dialog, Icon, useToast } from '@/components/ui'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError'

interface LibraryModeratorActionsProps {
  /** Co usuwamy — wpływa na treść ostrzeżenia. */
  kind: 'game' | 'expansion'
  name: string
  editHref: string
  remove: () => Promise<void>
  /** Dokąd wracamy po usunięciu — strona szczegółów przestaje wtedy istnieć. */
  afterDeleteHref: string
  /** Lista dodatków gry; pokazywana, gdy backend blokuje usunięcie (GAME_HAS_EXPANSIONS). */
  expansionsHref?: string
}

/**
 * Narzędzia moderatora na stronie pozycji z biblioteki: edycja i trwałe usunięcie.
 *
 * Widoczne wyłącznie dla MODERATOR/ADMIN — endpointy `/moderation/**` i tak
 * odpowiadają zwykłemu użytkownikowi 403, ale przycisk, który zawsze kończy się
 * błędem, to zły interfejs.
 */
export function LibraryModeratorActions({
  kind,
  name,
  editHref,
  remove,
  afterDeleteHref,
  expansionsHref,
}: Readonly<LibraryModeratorActionsProps>) {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [blockedByExpansions, setBlockedByExpansions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasRole('ROLE_MODERATOR') && !hasRole('ROLE_ADMIN')) return null

  const close = () => {
    setConfirming(false)
    setError(null)
    setBlockedByExpansions(false)
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await remove()
      toast.success('Usunięto z biblioteki.')
      navigate(afterDeleteHref)
    } catch (err) {
      // Backend blokuje usunięcie gry, do której są dodatki — kaskada skasowałaby
      // cudze zgłoszenia i wpisy w kolekcjach, więc najpierw trzeba zdjąć dodatki.
      if (getApiErrorCode(err) === 'GAME_HAS_EXPANSIONS') setBlockedByExpansions(true)
      else setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4">
      <span className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant">
        <Icon name="shield_person" className="text-base" aria-hidden="true" />
        Narzędzia moderatora
      </span>
      <ButtonLink to={editHref} size="sm" variant="secondary" iconLeft="edit">
        Edytuj w bibliotece
      </ButtonLink>
      <Button size="sm" variant="danger" iconLeft="delete" onClick={() => setConfirming(true)}>
        Usuń z biblioteki
      </Button>

      <Dialog open={confirming} onClose={close} title="Usunąć z biblioteki?">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            <strong>„{name}"</strong> zniknie z biblioteki na stałe
            {kind === 'game' ? '' : ' razem z przypisaniem do gry bazowej'} i z kolekcji wszystkich
            użytkowników, którzy ją dodali. <strong>Tej operacji nie da się cofnąć.</strong>
          </p>

          {blockedByExpansions && (
            <div role="alert" className="space-y-2 rounded-2xl bg-error-container p-3">
              <p className="text-sm text-on-error-container">
                Tej gry nie da się usunąć, dopóki ma dodatki — usuń je najpierw.
              </p>
              {expansionsHref && (
                <ButtonLink to={expansionsHref} size="sm" variant="secondary" iconLeft="extension">
                  Zobacz dodatki tej gry
                </ButtonLink>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Anuluj
            </Button>
            <Button
              variant="danger"
              iconLeft="delete_forever"
              loading={busy}
              disabled={blockedByExpansions}
              onClick={() => void confirmDelete()}
            >
              Usuń trwale
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}
