import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '@/routes/paths'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ')

/** Wspólny szkielet strony: górna nawigacja + obszar treści (Outlet). */
export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to={ROUTES.home} className="text-lg font-bold text-violet-400">
            GameHive
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to={ROUTES.home} end className={navLinkClass}>
              Start
            </NavLink>
            <NavLink to={ROUTES.profile} className={navLinkClass}>
              Profil
            </NavLink>
            <NavLink to={ROUTES.login} className={navLinkClass}>
              Logowanie
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        GameHive &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}