import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { isDark, subscribeTheme, toggleTheme } from '@/lib/theme'
import { Icon } from '@/components/ui'

/**
 * Przełącznik motywu jasny/ciemny. Stan czytany ze wspólnego store
 * (`@/lib/theme`), więc wszystkie instancje pozostają zsynchronizowane.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
      className={cn(
        'rounded-full p-2 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary',
        className,
      )}
    >
      <Icon name={dark ? 'light_mode' : 'dark_mode'} />
    </button>
  )
}
