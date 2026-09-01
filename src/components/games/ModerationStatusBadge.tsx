import type { ModerationStatus } from '@/api/types'
import { Badge } from '@/components/ui'

type Tone = 'neutral' | 'gold' | 'success' | 'danger' | 'info'

/**
 * Etykiety mówią, co status znaczy dla użytkownika, a nie jak nazywa się w bazie:
 * APPROVED to dla niego „w bibliotece", a nie „zatwierdzone".
 */
const STATUS_META: Record<ModerationStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Szkic', tone: 'neutral' },
  PENDING: { label: 'Czeka na moderację', tone: 'info' },
  APPROVED: { label: 'W bibliotece', tone: 'success' },
  REJECTED: { label: 'Odrzucone', tone: 'danger' },
}

interface ModerationStatusBadgeProps {
  status: ModerationStatus
  className?: string
}

export function ModerationStatusBadge({ status, className }: ModerationStatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}
