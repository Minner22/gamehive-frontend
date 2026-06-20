import { Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

/**
 * Layout ekranów publicznych/auth: wycentrowana karta na tle z dekoracyjnymi
 * heksagonami (motyw Nectar). Bez nawigacji aplikacji.
 */
export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface p-6">
      {/* Dekoracyjne plamy światła */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed opacity-20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary-container opacity-10 blur-3xl" />
      {/* Heksagonalna dekoracja */}
      <div className="pointer-events-none absolute right-10 top-10 hidden gap-4 opacity-20 lg:grid lg:grid-cols-2">
        <div className="hex h-20 w-20 bg-primary" />
        <div className="hex mt-10 h-20 w-20 bg-primary-container" />
        <div className="hex h-20 w-20 bg-tertiary" />
      </div>

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <Outlet />
      </main>
    </div>
  )
}
