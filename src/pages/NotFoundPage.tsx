import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-violet-400">404</p>
      <h1 className="text-2xl font-semibold">Nie znaleziono strony</h1>
      <Link
        to={ROUTES.home}
        className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
      >
        Wróć na stronę główną
      </Link>
    </section>
  )
}