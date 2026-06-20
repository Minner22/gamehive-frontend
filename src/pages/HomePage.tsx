import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

const FEATURES = [
  { icon: 'inventory_2', title: 'The Vault', desc: 'Zarządzaj kolekcją gier planszowych w jednym miejscu.' },
  { icon: 'groups', title: 'Hives', desc: 'Dołączaj do społeczności i dziel się rozgrywkami.' },
  { icon: 'travel_explore', title: 'Odkrywaj', desc: 'Przeglądaj tytuły, dodatki i rekomendacje.' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-start gap-5 py-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-sm font-semibold text-on-primary-fixed">
          <Icon name="hive" filled className="text-base" />
          The Digital Hearth
        </span>
        <h1 className="max-w-2xl font-headline text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Witaj w <span className="text-primary">GameHive</span>
        </h1>
        <p className="max-w-xl text-lg text-on-surface-variant">
          Społecznościowa platforma dla graczy w gry planszowe. Szkielet i system
          designu są gotowe — kolejne ekrany powstają zgodnie z roadmapą.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button iconRight="arrow_forward" onClick={() => navigate(ROUTES.register)}>
            Załóż konto
          </Button>
          <Button variant="secondary" onClick={() => navigate(ROUTES.login)}>
            Zaloguj się
          </Button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} interactive>
            <span className="hex-flat grid h-12 w-12 place-items-center bg-primary/10">
              <Icon name={f.icon} className="text-2xl text-primary" />
            </span>
            <h3 className="mt-4 font-headline text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
