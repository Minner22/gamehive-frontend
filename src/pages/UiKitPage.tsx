import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Chip,
  HexAvatar,
  Icon,
  Input,
  Spinner,
} from '@/components/ui'
import { ROUTES } from '@/routes/paths'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-headline text-xl font-bold text-on-surface">{title}</h2>
      {children}
    </section>
  )
}

const SWATCHES = [
  { name: 'primary', cls: 'bg-primary text-on-primary' },
  { name: 'primary-container', cls: 'bg-primary-container text-on-primary-container' },
  { name: 'secondary', cls: 'bg-secondary text-on-secondary' },
  { name: 'surface-container-low', cls: 'bg-surface-container-low text-on-surface' },
  { name: 'surface-container-high', cls: 'bg-surface-container-high text-on-surface' },
  { name: 'error', cls: 'bg-error text-on-error' },
]

/** Wizytówka systemu Nectar — przegląd tokenów i komponentów UI-kitu. */
export default function UiKitPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight">UI-kit — Nectar</h1>
        <p className="mt-1 text-on-surface-variant">
          Przegląd tokenów i komponentów systemu designu GameHive.
        </p>
      </header>

      <Section title="Kolory">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className={`flex h-20 items-end rounded-2xl p-3 text-xs font-semibold shadow-soft ${s.cls}`}
            >
              {s.name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Przyciski">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Wejdź do ula</Button>
          <Button variant="secondary">Drugorzędny</Button>
          <Button variant="tertiary">Anuluj</Button>
          <Button variant="ghost" iconLeft="add">
            Ghost
          </Button>
          <Button iconRight="login">Z ikoną</Button>
          <ButtonLink to={ROUTES.uiKit} variant="tertiary" iconRight="open_in_new">
            ButtonLink
          </ButtonLink>
          <Button loading>Ładowanie</Button>
          <Button disabled>Wyłączony</Button>
        </div>
      </Section>

      <Section title="Pola formularza">
        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <Input label="Nazwa użytkownika" iconLeft="person" placeholder="john.doe" />
          <Input label="E-mail" iconLeft="mail" placeholder="john@example.com" hint="Na ten adres wyślemy link" />
          <Input
            label="Hasło"
            type="password"
            iconLeft="lock"
            placeholder="••••••••"
            error="Hasło musi mieć min. 8 znaków"
          />
          <Input label="Telefon" iconLeft="call" placeholder="+48123456789" />
        </div>
      </Section>

      <Section title="Karty & odznaki">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h3 className="font-headline font-bold">Vault Card</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Statyczna powierzchnia.</p>
          </Card>
          <Card interactive>
            <h3 className="font-headline font-bold">Interactive</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Najedź — unosi się.</p>
          </Card>
          <Card className="flex items-center gap-3">
            <HexAvatar name="Elena Rostova" size={56} />
            <div>
              <p className="font-semibold">Elena Rostova</p>
              <div className="mt-1 flex gap-1.5">
                <Badge tone="gold">ROLE_ADMIN</Badge>
                <Badge tone="success">Aktywny</Badge>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Chipy & odznaki tonów">
        <div className="flex flex-wrap items-center gap-2">
          <Chip selected>Strategiczne</Chip>
          <Chip>Rodzinne</Chip>
          <Chip>Kooperacyjne</Chip>
          <span className="mx-2 h-6 w-px bg-outline-variant/40" />
          <Badge tone="neutral">neutral</Badge>
          <Badge tone="gold">gold</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="info">info</Badge>
        </div>
      </Section>

      <Section title="Ikony & wskaźniki">
        <div className="flex items-center gap-4 text-primary">
          <Icon name="hive" filled className="text-3xl" />
          <Icon name="inventory_2" className="text-3xl" />
          <Icon name="groups" className="text-3xl" />
          <Icon name="dashboard" className="text-3xl" />
          <Spinner className="text-3xl" />
        </div>
      </Section>
    </div>
  )
}
