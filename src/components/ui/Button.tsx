import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Nazwa ikony Material Symbols po lewej / prawej stronie tekstu. */
  iconLeft?: string
  iconRight?: string
  /** Pełna szerokość kontenera. */
  fullWidth?: boolean
  /** Stan ładowania — pokazuje spinner (Button dodatkowo blokuje przycisk). */
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
  danger: 'bg-error text-on-error hover:bg-error/90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
}

function buttonClass({ variant = 'primary', size = 'md', fullWidth }: ButtonStyleProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full')
}

function ButtonInner({ loading, iconLeft, iconRight, children }: ButtonStyleProps) {
  return (
    <>
      {loading ? (
        <Spinner className="text-[1.1em]" />
      ) : (
        iconLeft && <Icon name={iconLeft} className="text-[1.2em]" />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} className="text-[1.2em]" />}
    </>
  )
}

type ButtonProps = ButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement>

/** Przycisk akcji (renderuje <button>). Do nawigacji użyj ButtonLink. */
export function Button({
  variant,
  size,
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
      className={cn(buttonClass({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      <ButtonInner loading={loading} iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </ButtonInner>
    </button>
  )
}

type ButtonLinkProps = ButtonStyleProps & Omit<LinkProps, 'children'>

/** Link w wyglądzie przycisku (renderuje <a> przez React Router) — zachowuje
 * semantykę linku: ctrl/środkowy klik, „otwórz w nowej karcie", href. */
export function ButtonLink({
  variant,
  size,
  iconLeft,
  iconRight,
  fullWidth,
  loading,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClass({ variant, size, fullWidth }), className)} {...rest}>
      <ButtonInner loading={loading} iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </ButtonInner>
    </Link>
  )
}
