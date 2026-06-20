import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="hex-flat grid h-20 w-20 place-items-center bg-primary/10">
        <span className="font-headline text-3xl font-extrabold text-primary">404</span>
      </span>
      <h1 className="font-headline text-2xl font-bold">Nie znaleziono strony</h1>
      <p className="max-w-sm text-on-surface-variant">
        Ta ścieżka nie prowadzi do żadnego ula.
      </p>
      <Button iconLeft="home" onClick={() => navigate(ROUTES.home)}>
        Wróć na stronę główną
      </Button>
    </section>
  )
}
