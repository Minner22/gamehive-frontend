import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from '@/components/ui'

interface AuthResultProps {
  /** Nazwa ikony Material Symbols w heksagonalnym znaczniku (opcjonalna). */
  icon?: string
  children: ReactNode
}

/**
 * Wynik akcji auth (sukces/komunikat): wycentrowany blok ogłaszany czytnikom
 * (`role="status"`) i przejmujący fokus po zamontowaniu. Wspólny dla rejestracji,
 * aktywacji i ponownego wysłania — announce + focus żyją w jednym miejscu.
 */
export function AuthResult({ icon, children }: AuthResultProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="flex flex-col items-center gap-3 text-center focus:outline-none"
    >
      {icon && (
        <span className="hex-flat grid h-14 w-14 place-items-center bg-primary/10">
          <Icon name={icon} filled className="text-2xl text-primary" />
        </span>
      )}
      {children}
    </div>
  )
}
