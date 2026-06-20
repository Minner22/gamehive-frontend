import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { ROUTES } from '@/routes/paths'

interface NavItem {
  to: string
  icon: string
  label: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, icon: 'dashboard', label: 'Start', end: true },
  { to: ROUTES.profile, icon: 'person', label: 'Profil' },
  { to: ROUTES.uiKit, icon: 'palette', label: 'UI-kit' },
]

// Sekcje produktu czekające na backend (patrz roadmapa, Faza 6).
const SOON_ITEMS = [
  { icon: 'inventory_2', label: 'The Vault' },
  { icon: 'groups', label: 'Hives' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300 ease-out',
    isActive
      ? 'bg-primary-container font-bold text-on-primary-container'
      : 'font-medium text-secondary hover:bg-surface-container-high',
  )
}

/** Lewa nawigacja aplikacji (desktop + zawartość mobilnego szuflady). */
export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full w-64 flex-col bg-surface-container-low py-6">
      <div className="mb-8 px-6">
        <Brand />
        <p className="mt-2 text-sm text-on-surface-variant">The Digital Hearth</p>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <p className="px-4 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
          Wkrótce
        </p>
        {SOON_ITEMS.map((item) => (
          <span
            key={item.label}
            aria-disabled="true"
            title="Dostępne po stronie backendu"
            className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface-variant/40"
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 px-5 pt-4">
        <span className="text-xs text-on-surface-variant/60">v0 · GH-2</span>
        <ThemeToggle />
      </div>
    </nav>
  )
}
