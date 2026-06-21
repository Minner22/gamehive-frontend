import { useAuth } from '@/auth/AuthContext'
import { Badge, ButtonLink, Card, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

// Statystyki wymagają backendu (gry, kolekcje, partie) — Faza 6. Na razie placeholdery.
const STATS = [
  { icon: 'inventory_2', label: 'Gry w kolekcji' },
  { icon: 'groups', label: 'Hive’y' },
  { icon: 'sports_esports', label: 'Rozegrane partie' },
  { icon: 'emoji_events', label: 'Win rate' },
]

function PlaceholderSection({
  icon,
  title,
  desc,
}: {
  icon: string
  title: string
  desc: string
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-lg font-bold">{title}</h2>
        <Badge tone="neutral">Wkrótce</Badge>
      </div>
      <div className="flex flex-col items-center gap-2 py-8 text-center text-on-surface-variant">
        <Icon name={icon} className="text-4xl opacity-40" />
        <p className="text-sm">{desc}</p>
        <p className="text-xs opacity-70">Dostępne, gdy backend udostępni dane (Faza 6).</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const name = user?.profile?.firstName || user?.username || 'graczu'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">
          Cześć, {name}!
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Twój hub GameHive. Statystyki i aktywność pojawią się, gdy backend udostępni
          gry, kolekcje i hive’y.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <Icon name={stat.icon} className="text-2xl text-primary" />
              <Badge tone="neutral">Wkrótce</Badge>
            </div>
            <p className="text-2xl font-bold text-on-surface-variant/40">—</p>
            <p className="text-sm text-on-surface-variant">{stat.label}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderSection
          icon="history"
          title="Ostatnia aktywność"
          desc="Twoje rozgrywki i zmiany w kolekcji."
        />
        <PlaceholderSection
          icon="groups"
          title="Twoje hive’y"
          desc="Społeczności, do których należysz."
        />
      </div>

      <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-headline text-lg font-bold">Uzupełnij profil</h2>
          <p className="text-sm text-on-surface-variant">
            Dodaj dane i zdjęcie, żeby Twój hive wiedział, kim jesteś.
          </p>
        </div>
        <ButtonLink to={ROUTES.profileEdit} variant="secondary" iconLeft="edit">
          Edytuj profil
        </ButtonLink>
      </Card>
    </div>
  )
}
