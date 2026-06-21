import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/auth/AuthContext'
import { Button, ButtonLink, Card, Input } from '@/components/ui'
import { updateProfile } from '@/api/users'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation'
import { useApiForm } from '@/lib/useApiForm'
import { ROUTES } from '@/routes/paths'

// Pola mapowalne na błędy serwera — top-level + zagnieżdżone ścieżki adresu,
// żeby błędy walidacji address.* trafiały pod właściwe pole, nie do toasta.
const FIELDS = [
  ...Object.keys(profileUpdateSchema.shape).filter((key) => key !== 'address'),
  'address.street',
  'address.city',
  'address.postalCode',
  'address.country',
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <h2 className="font-headline text-lg font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  )
}

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile

  const {
    register,
    submit,
    toast,
    formState: { errors, isSubmitting },
  } = useApiForm<ProfileUpdateInput>(
    {
      resolver: zodResolver(profileUpdateSchema),
      defaultValues: {
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        phoneNumber: profile?.phoneNumber ?? '',
        dateOfBirth: profile?.dateOfBirth ?? '',
        profilePictureUrl: profile?.profilePictureUrl ?? '',
        address: {
          street: profile?.address?.street ?? '',
          city: profile?.address?.city ?? '',
          postalCode: profile?.address?.postalCode ?? '',
          country: profile?.address?.country ?? '',
        },
      },
    },
    FIELDS,
  )

  const onSubmit = submit(async (data) => {
    await updateProfile(data)
    // Odświeżenie sesji best-effort — zapis już się udał, błąd getMe nie może
    // udawać nieudanego zapisu.
    try {
      await refreshUser()
    } catch {
      /* ignorujemy — dane zapisane, profil odświeży się przy następnym wejściu */
    }
    toast.success('Profil zaktualizowany')
    navigate(ROUTES.profile)
  })

  if (!user) return null // ProtectedRoute gwarantuje usera; guard dla TS/bezpieczeństwa

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Edycja profilu</h1>
        <p className="mt-1 text-on-surface-variant">
          Zmień dane swojego konta. Puste pola pozostaną bez zmian.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Section title="Dane osobowe">
          <Input
            label="Imię"
            iconLeft="badge"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Nazwisko"
            iconLeft="badge"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
          <Input
            label="Telefon"
            iconLeft="call"
            placeholder="+48123456789"
            autoComplete="tel"
            hint="Format E.164"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />
          <Input
            label="Data urodzenia"
            iconLeft="cake"
            type="date"
            autoComplete="bday"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <Input
            label="URL zdjęcia profilowego"
            iconLeft="image"
            type="url"
            placeholder="https://…"
            hint="Wklej link do obrazka (upload pojawi się później)"
            error={errors.profilePictureUrl?.message}
            className="sm:col-span-2"
            {...register('profilePictureUrl')}
          />
        </Section>

        <Section title="Adres">
          <Input
            label="Ulica"
            iconLeft="home"
            autoComplete="street-address"
            error={errors.address?.street?.message}
            {...register('address.street')}
          />
          <Input
            label="Miasto"
            iconLeft="location_city"
            autoComplete="address-level2"
            error={errors.address?.city?.message}
            {...register('address.city')}
          />
          <Input
            label="Kod pocztowy"
            iconLeft="markunread_mailbox"
            autoComplete="postal-code"
            error={errors.address?.postalCode?.message}
            {...register('address.postalCode')}
          />
          <Input
            label="Kraj"
            iconLeft="public"
            autoComplete="country-name"
            error={errors.address?.country?.message}
            {...register('address.country')}
          />
        </Section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isSubmitting} iconRight="check">
            Zapisz zmiany
          </Button>
          <ButtonLink to={ROUTES.profile} variant="secondary">
            Anuluj
          </ButtonLink>
        </div>
      </form>
    </div>
  )
}
