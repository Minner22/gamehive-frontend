import { forwardRef, type TextareaHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  /** Komunikat błędu — zmienia styl pola na błędny i wyświetla tekst. */
  error?: string
  /** Tekst pomocniczy pod polem (gdy brak błędu). */
  hint?: string
}

/** Pole wielolinijkowe w stylu „tactile input" — spójne z `Input`. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, rows = 5, ...rest },
  ref,
) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="block px-1 text-sm font-semibold text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3.5 text-on-surface',
          'placeholder:text-on-surface-variant/50 transition-all duration-300',
          'focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary',
          error && 'bg-error-container/20 ring-2 ring-error/50 focus:ring-error',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="px-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId}-hint`} className="px-1 text-xs text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
})
