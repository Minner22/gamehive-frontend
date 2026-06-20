import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

function isDarkInitially(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/** Przełącznik motywu jasny/ciemny (klasa .dark na <html>, zapis w localStorage). */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(isDarkInitially)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* localStorage niedostępny — pomijamy zapis */
    }
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
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
