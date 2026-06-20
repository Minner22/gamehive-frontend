import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { Icon } from '@/components/ui/Icon'

/** Górny pasek widoczny tylko na mobile — otwiera szufladę nawigacji. */
export function TopAppBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-surface-container-high/80 px-4 py-3 backdrop-blur-xl md:hidden">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Otwórz menu"
        className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-highest/50 active:scale-95"
      >
        <Icon name="menu" />
      </button>
      <Brand />
      <ThemeToggle />
    </header>
  )
}
