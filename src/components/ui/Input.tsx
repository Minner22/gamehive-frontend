import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Nazwa ikony Material Symbols po lewej stronie pola. */
  iconLeft?: string
  /** Element po prawej stronie pola (np. przycisk podglądu hasła). */
  trailing?: ReactNode
  /** Komunikat błędu — zmienia styl pola na błędny i wyświetla tekst. */
  error?: string
  /** Tekst pomocniczy pod polem (gdy brak błędu). */
  hint?: string
}

/**
 * "Tactile input" wg systemu Nectar: wypełnione tło surface-container-low,
 * brak obrysu, na focus jaśniejsze tło + ghost-border primary.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, iconLeft, trailing, error, hint, id, className, ...rest },
  ref,
) {
  const reactId = useId()
  const inputId = id ?? reactId
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block px-1 text-sm font-semibold text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Icon name={iconLeft} className="text-xl text-secondary" />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-2xl border-0 bg-surface-container-low py-3.5 text-on-surface',
            'placeholder:text-on-surface-variant/50 transition-all duration-300',
            'focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary',
            iconLeft ? 'pl-11' : 'pl-4',
            trailing ? 'pr-11' : 'pr-4',
            error && 'bg-error-container/20 ring-2 ring-error/50 focus:ring-error',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            {trailing}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="px-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="px-1 text-xs text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
})
