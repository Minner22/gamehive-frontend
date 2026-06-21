import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { HexAvatar, Icon } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'
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
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout() // czyści sesję lokalnie nawet przy błędzie serwera
    onNavigate?.()
    navigate(ROUTES.home)
  }

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

      <div className="mt-auto space-y-3 border-t border-outline-variant/20 px-4 pt-4">
        {user && (
          <div className="flex items-center gap-3 px-1">
            <HexAvatar
              name={user.username}
              src={user.profile?.profilePictureUrl}
              size={36}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">
                {user.username}
              </p>
              <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              <Icon name="logout" />
              Wyloguj
            </button>
          ) : (
            <NavLink
              to={ROUTES.login}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-high"
            >
              <Icon name="login" />
              Zaloguj się
            </NavLink>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
