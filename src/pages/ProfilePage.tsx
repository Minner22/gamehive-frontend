import { Card, HexAvatar, Icon } from '@/components/ui'

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Mój profil</h1>
        <p className="mt-1 text-on-surface-variant">
          Dane konta zalogowanego użytkownika.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-6 sm:flex-row">
        <HexAvatar name="Gość" size={96} />
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="info" />
          <p className="text-sm">
            Pobranie danych z <code className="text-primary">GET /api/v1/users/me</code> dodamy w
            GH-10 (Faza 3). Tu pojawi się username, e-mail, role i profil.
          </p>
        </div>
      </Card>
    </div>
  )
}
