import { ButtonLink, Card, Icon } from '@/components/ui'
import { ROUTES } from '@/routes/paths'

export default function ProfileEditPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Edycja profilu</h1>
      </header>
      <Card className="flex items-center gap-3 text-on-surface-variant">
        <Icon name="construction" className="text-2xl text-primary" />
        <p className="text-sm">Edycja profilu będzie wkrótce dostępna.</p>
      </Card>
      <ButtonLink to={ROUTES.profile} variant="secondary" iconLeft="arrow_back">
        Wróć do profilu
      </ButtonLink>
    </div>
  )
}
