import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/paths'

export default function HomePage() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Witaj w <span className="text-violet-400">GameHive</span>
      </h1>
      <p className="max-w-xl text-slate-400">
        Frontend platformy GameHive. Szkielet projektu jest gotowy — kolejne
        ekrany powstają zgodnie z roadmapą.
      </p>
      <div className="flex gap-3">
        <Link
          to={ROUTES.register}
          className="rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Załóż konto
        </Link>
        <Link
          to={ROUTES.login}
          className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          Zaloguj się
        </Link>
      </div>
    </section>
  )
}