import type { ReactNode } from 'react'
import { AuthProvider } from '@/auth/AuthContext'
import { CollectionProvider } from '@/collection/CollectionContext'
import { ToastProvider } from '@/components/ui'

/**
 * Ta sama kolejność providerów co w `main.tsx` — strony modułu gier korzystają
 * z sesji, toastów i kolekcji naraz, więc test bez nich wywala się na kontekście.
 *
 * Domyślny handler MSW odpowiada na `GET /auth/refresh` kodem 401, więc sesja
 * ustala się jako niezalogowana i `CollectionProvider` nie pobiera kolekcji.
 * Testom, które potrzebują zalogowanego użytkownika, wystarczy nadpisać ten
 * handler przez `server.use(...)`.
 */
export function TestProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CollectionProvider>{children}</CollectionProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
