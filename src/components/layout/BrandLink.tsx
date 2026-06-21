import { Link } from 'react-router-dom'
import { Brand } from './Brand'
import { ROUTES } from '@/routes/paths'

interface BrandLinkProps {
  /** Tylko znak (heksagon), bez wordmarku. */
  iconOnly?: boolean
  className?: string
  /** Wywoływane po kliknięciu (np. zamknięcie szuflady nawigacji na mobile). */
  onClick?: () => void
}

/** Logo marki jako link do strony głównej (jeden cel + aria-label dla całej apki). */
export function BrandLink({ iconOnly, className, onClick }: BrandLinkProps) {
  return (
    <Link
      to={ROUTES.home}
      onClick={onClick}
      aria-label="GameHive — strona główna"
      className={className}
    >
      <Brand iconOnly={iconOnly} />
    </Link>
  )
}
