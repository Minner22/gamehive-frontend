import type { ModerationStatus } from '@/api/types'

/**
 * Reguły przepływu moderacji po stronie autora zgłoszenia — jedno miejsce dla
 * całego modułu, bo backend odpowiada na ich złamanie konkretnymi kodami
 * (`GAME_NOT_EDITABLE`, `EXPANSION_NOT_EDITABLE`) i UI nie powinien tych ścieżek
 * w ogóle proponować.
 */

/** Edytować można własny szkic albo zgłoszenie odrzucone. */
export function isSubmissionEditable(status: ModerationStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED'
}

/** Do moderacji wysyła się z tych samych stanów co edycja (DRAFT/REJECTED → PENDING). */
export function isSubmittable(status: ModerationStatus): boolean {
  return isSubmissionEditable(status)
}

/** Co dzieje się ze zgłoszeniem — zdanie dla autora, nie nazwa stanu z bazy. */
export const STATUS_HINT: Record<ModerationStatus, string> = {
  DRAFT: 'Szkic widoczny tylko dla Ciebie — wyślij go, gdy będzie gotowy.',
  PENDING: 'Czeka na decyzję moderatora. W tym czasie nie da się go edytować.',
  APPROVED: 'Zatwierdzone — pozycja jest w bibliotece dla wszystkich.',
  REJECTED: 'Odrzucone. Popraw zgłoszenie i wyślij je ponownie.',
}
