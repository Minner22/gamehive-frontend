import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Nazwa ikony Material Symbols po lewej / prawej stronie tekstu. */
  iconLeft?: string
  iconRight?: string
  /** Pełna szerokość kontenera. */
  fullWidth?: boolean
  /** Stan ładowania — blokuje przycisk i pokazuje spinner. */
  loading?: boolean
  children?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full ' +
  'transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-glow ' +
    'hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim',
  tertiary: 'text-primary hover:bg-primary/5',
  ghost:
    'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Icon name="progress_activity" className="animate-spin text-[1.1em]" />
      ) : (
        iconLeft && <Icon name={iconLeft} className="text-[1.2em]" />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} className="text-[1.2em]" />}
    </button>
  )
}
