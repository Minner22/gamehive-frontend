import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { TopAppBar } from './TopAppBar'

/**
 * Szkielet aplikacji (Nectar): stała lewa nawigacja na desktopie,
 * górny pasek + wysuwana szuflada na mobile, obszar treści (Outlet).
 */
export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Otwarta szuflada: Escape zamyka + blokada scrolla tła.
  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <SideNav />
      </aside>

      {/* Górny pasek — mobile */}
      <TopAppBar onMenu={() => setDrawerOpen(true)} />

      {/* Szuflada — mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            className="absolute inset-0 bg-inverse-surface/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-ambient">
            <SideNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Treść */}
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
