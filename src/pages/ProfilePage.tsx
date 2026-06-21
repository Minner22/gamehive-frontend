import { useAuth } from '@/auth/AuthContext'
import { Badge, ButtonLink, Card, HexAvatar, Icon, Section } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

/** Formatuje datę ISO (YYYY-MM-DD) na czytelną polską; surową zwraca w razie błędu. */
function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined
  // Datę bez czasu parsujemy jako lokalną, żeby strefa nie przesunęła dnia.
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function Field({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="mt-0.5 text-xl text-secondary" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
          {label}
        </dt>
        <dd className="truncate text-sm text-on-surface" title={value || undefined}>
          {value || <span className="text-on-surface-variant/50">— nie podano</span>}
        </dd>
      </div>
    </div>
  )
}

// ROLE_USER to domyślna rola (nie pokazujemy); z reszty ścinamy prefiks ROLE_.
function visibleRoles(roles: readonly string[] | undefined): string[] {
  return (roles ?? [])
    .filter((role) => role !== 'ROLE_USER')
    .map((role) => role.replace(/^ROLE_/, ''))
}

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null // ProtectedRoute gwarantuje usera; guard dla TS

  const profile = user.profile
  const address = profile?.address
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center gap-5 sm:flex-row sm:text-left">
        <HexAvatar src={profile?.profilePictureUrl} name={fullName || user.username} size={96} />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-headline text-2xl font-bold">{fullName || user.username}</h1>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            @{user.username} · {user.email}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {user.enabled ? (
              <Badge tone="success">Aktywne</Badge>
            ) : (
              <Badge tone="danger">Nieaktywne</Badge>
            )}
            {visibleRoles(user.roles).map((role) => (
              <Badge key={role} tone="gold">
                {role}
              </Badge>
            ))}
          </div>
        </div>
        <ButtonLink to={ROUTES.profileEdit} variant="secondary" iconLeft="edit">
          Edytuj profil
        </ButtonLink>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Dane osobowe">
          <dl className="grid gap-4">
            <Field icon="badge" label="Imię" value={profile?.firstName} />
            <Field icon="badge" label="Nazwisko" value={profile?.lastName} />
            <Field icon="call" label="Telefon" value={profile?.phoneNumber} />
            <Field icon="cake" label="Data urodzenia" value={formatDate(profile?.dateOfBirth)} />
          </dl>
        </Section>

        <Section title="Adres">
          <dl className="grid gap-4">
            <Field icon="home" label="Ulica" value={address?.street} />
            <Field icon="location_city" label="Miasto" value={address?.city} />
            <Field icon="markunread_mailbox" label="Kod pocztowy" value={address?.postalCode} />
            <Field icon="public" label="Kraj" value={address?.country} />
          </dl>
        </Section>
      </div>
    </div>
  )
}
