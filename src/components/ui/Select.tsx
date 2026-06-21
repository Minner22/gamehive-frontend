import { forwardRef, type SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

/** Pole wyboru w stylu Nectar „tactile input" (spójne z Input). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, className, children, ...rest },
  ref,
) {
  const reactId = useId()
  const selectId = id ?? reactId

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block px-1 text-sm font-semibold text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'block w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3.5 text-on-surface',
          'transition-all duration-300 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
})
