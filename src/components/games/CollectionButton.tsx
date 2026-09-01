import { useState } from 'react'
import { useCollection, type CollectionTarget } from '@/collection/CollectionContext'
import { Button } from '@/components/ui'

interface CollectionButtonProps {
  target: CollectionTarget
  id: number
  /** Nazwa pozycji — trafia do etykiety dla czytników ekranu. */
  name: string
  size?: 'sm' | 'md'
  /** Wywoływane po **udanej** zmianie; `owned` mówi, jaki jest stan po operacji. */
  onChange?: (owned: boolean) => void
  /**
   * Znany stan posiadania, nadrzędny wobec kontekstu. Używa go The Vault, gdzie
   * każda pozycja jest posiadana z definicji — niezależnie od tego, czy kontekst
   * zdążył (albo mógł) wczytać zawartość kolekcji.
   */
  owned?: boolean
}

/**
 * Przełącznik „mam / nie mam" dla gry albo dodatku.
 *
 * Stan bierze z kontekstu kolekcji, a nie z własnego `useState`, żeby dodanie
 * z karty w bibliotece było od razu widoczne w The Vault i na stronie szczegółów.
 * Backend nie ma pytania „czy mam tę pozycję", więc przy nieznanym stanie przycisk
 * proponuje dodanie — duplikat wraca jako 409 i jest obsłużony jak sukces.
 */
export function CollectionButton({
  target,
  id,
  name,
  size = 'sm',
  onChange,
  owned: ownedOverride,
}: Readonly<CollectionButtonProps>) {
  const { owns, add, remove } = useCollection()
  const [busy, setBusy] = useState(false)
  const owned = ownedOverride ?? owns(target, id)

  const toggle = async () => {
    setBusy(true)
    try {
      const changed = await (owned ? remove(target, id) : add(target, id))
      if (changed) onChange?.(!owned)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      size={size}
      variant={owned ? 'secondary' : 'primary'}
      iconLeft={owned ? 'check_circle' : 'add'}
      loading={busy}
      onClick={toggle}
      aria-label={owned ? `Usuń z kolekcji: ${name}` : `Dodaj do kolekcji: ${name}`}
    >
      {owned ? 'W kolekcji' : 'Do kolekcji'}
    </Button>
  )
}
