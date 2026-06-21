import type { ReactNode } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Badge, ButtonLink, Card, HexAvatar, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

function Field({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="mt-0.5 text-xl text-secondary" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
          {label}
        </p>
        <p className="truncate text-sm text-on-surface">
          {value || <span className="text-on-surface-variant/50">— nie podano</span>}
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <h2 className="font-headline text-lg font-bold">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </Card>
  )
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
            {user.roles.map((role) => (
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
          <Field icon="badge" label="Imię" value={profile?.firstName} />
          <Field icon="badge" label="Nazwisko" value={profile?.lastName} />
          <Field icon="call" label="Telefon" value={profile?.phoneNumber} />
          <Field icon="cake" label="Data urodzenia" value={profile?.dateOfBirth} />
        </Section>

        <Section title="Adres">
          <Field icon="home" label="Ulica" value={address?.street} />
          <Field icon="location_city" label="Miasto" value={address?.city} />
          <Field icon="markunread_mailbox" label="Kod pocztowy" value={address?.postalCode} />
          <Field icon="public" label="Kraj" value={address?.country} />
        </Section>
      </div>
    </div>
  )
}
