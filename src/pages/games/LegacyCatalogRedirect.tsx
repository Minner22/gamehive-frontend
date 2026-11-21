import { Navigate, useLocation } from 'react-router-dom'
import { legacyCatalogHref } from '@/lib/catalog'

/**
 * Stare adresy katalogu (`/games/search`, `/expansions`) sprzed scalenia ekranów
 * w „Odkrywaj”. Przekierowanie zachowuje frazę, filtry i stronę — linki z historii,
 * zakładki w przeglądarce i wklejone adresy prowadzą w to samo miejsce.
 *
 * Bez `ProtectedRoute`: sama bramka stoi na trasie docelowej.
 */
export default function LegacyCatalogRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={legacyCatalogHref(pathname, search)} replace />
}
