import { Badge } from '@/components/ui'

/**
 * Podpis przy wartości dodatku: skąd ona jest. Sedno modelu nadpisań — tak samo
 * potrzebny na stronie dodatku, jak w kolejce moderacji, gdzie moderator ocenia,
 * co dodatek faktycznie zmienia w grze bazowej.
 */
export function SourceNote({ inherited }: Readonly<{ inherited: boolean }>) {
  return inherited ? (
    <span className="text-xs text-on-surface-variant">z gry bazowej</span>
  ) : (
    <Badge tone="gold">nadpisane</Badge>
  )
}
