import { useCallback } from 'react'
import { Controller } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGame, getGame, submitGame, updateGame } from '@/api/games'
import { suggestAuthors, suggestPublishers } from '@/api/taxonomy'
import type { ApiError, GameDto, GameRequestDto } from '@/api/types'
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  Combobox,
  EmptyState,
  Input,
  Section,
  Spinner,
  Textarea,
  type ComboboxItem,
} from '@/components/ui'
import { formatAuthorName, splitAuthorName } from '@/lib/authorName'
import { useApiForm } from '@/lib/useApiForm'
import { useResource } from '@/lib/useResource'
import { useTaxonomyOptions } from '@/lib/useTaxonomyOptions'
import { gameSubmissionSchema, type GameSubmissionInput } from '@/lib/validation'
import { ROUTES } from '@/routes/paths'

/** Kody domenowe backendu przypisane do pól, których naprawdę dotyczą. */
const FIELD_BY_ERROR_CODE: Record<string, keyof GameSubmissionInput> = {
  INVALID_PLAYER_COUNT: 'maxPlayers',
  PUBLISHER_REQUIRED: 'publishers',
  CATEGORY_REQUIRED: 'categoryIds',
}

const EMPTY_FORM: GameSubmissionInput = {
  title: '',
  description: '',
  minPlayers: '',
  maxPlayers: '',
  playingTimeMinutes: '',
  yearPublished: '',
  minAge: '',
  coverImageUrl: '',
  publishers: [],
  authors: [],
  categoryIds: [],
  mechanicIds: [],
}

const FORM_FIELDS = Object.keys(EMPTY_FORM)

/** Edytować można wyłącznie własny szkic albo zgłoszenie odrzucone. */
function isEditable(game: GameDto): boolean {
  return game.moderationStatus === 'DRAFT' || game.moderationStatus === 'REJECTED'
}

function formValuesFromGame(game: GameDto): GameSubmissionInput {
  return {
    title: game.title,
    description: game.description,
    minPlayers: String(game.minPlayers),
    maxPlayers: String(game.maxPlayers),
    playingTimeMinutes: String(game.playingTimeMinutes),
    yearPublished: String(game.yearPublished),
    minAge: String(game.minAge),
    coverImageUrl: game.coverImageUrl ?? '',
    publishers: game.publishers.map((p) => ({
      id: p.id,
      label: p.name ?? '',
      pending: p.status === 'PENDING',
    })),
    authors: game.authors.map((a) => ({
      id: a.id,
      label: formatAuthorName(a),
      pending: a.status === 'PENDING',
    })),
    categoryIds: game.categories.map((c) => c.id).filter((id): id is number => id !== undefined),
    mechanicIds: game.mechanics.map((m) => m.id).filter((id): id is number => id !== undefined),
  }
}

/** Rozdziela wybór z pól z podpowiedziami na „istniejące id" i „nowe nazwy". */
function toRequestDto(values: ReturnType<typeof gameSubmissionSchema.parse>): GameRequestDto {
  const newAuthors = values.authors
    .filter((a) => a.id === undefined)
    .map((a) => splitAuthorName(a.label))
    .filter((name): name is NonNullable<typeof name> => name !== null)

  return {
    title: values.title,
    description: values.description,
    minPlayers: values.minPlayers,
    maxPlayers: values.maxPlayers,
    playingTimeMinutes: values.playingTimeMinutes,
    yearPublished: values.yearPublished,
    minAge: values.minAge,
    coverImageUrl: values.coverImageUrl,
    publisherIds: values.publishers.filter((p) => p.id !== undefined).map((p) => p.id as number),
    newPublisherNames: values.publishers.filter((p) => p.id === undefined).map((p) => p.label),
    categoryIds: values.categoryIds,
    mechanicIds: values.mechanicIds,
    authorIds: values.authors.filter((a) => a.id !== undefined).map((a) => a.id as number),
    newAuthors,
  }
}

function errorCodeOf(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data as ApiError | undefined)?.errorCode
}

interface GameFormProps {
  game?: GameDto
}

function GameForm({ game }: Readonly<GameFormProps>) {
  const navigate = useNavigate()
  const { categories, mechanics } = useTaxonomyOptions()
  const editing = game !== undefined
  const locked = editing && !isEditable(game)

  const form = useApiForm<GameSubmissionInput>(
    {
      resolver: zodResolver(gameSubmissionSchema),
      defaultValues: game ? formValuesFromGame(game) : EMPTY_FORM,
      mode: 'onTouched',
    },
    FORM_FIELDS,
  )
  const {
    register,
    control,
    formState: { errors, isSubmitting },
    setError,
    submit,
    toast,
    watch,
  } = form

  const coverUrl = watch('coverImageUrl')

  // Podpowiedzi w formacie pola: id + etykieta + informacja o oczekiwaniu.
  const fetchPublishers = useCallback(
    async (query: string): Promise<ComboboxItem[]> =>
      (await suggestPublishers(query)).map((p) => ({
        id: p.id,
        label: p.name ?? '',
        pending: p.status === 'PENDING',
      })),
    [],
  )
  const fetchAuthors = useCallback(
    async (query: string): Promise<ComboboxItem[]> =>
      (await suggestAuthors(query)).map((a) => ({
        id: a.id,
        label: formatAuthorName(a),
        pending: a.status === 'PENDING',
      })),
    [],
  )

  /** Błędy domenowe backendu trafiają przy pola, a nie do ogólnego toastu. */
  const handleDomainError = (error: unknown): boolean => {
    const code = errorCodeOf(error)
    if (!code) return false
    if (code === 'GAME_NOT_EDITABLE') {
      toast.error('Zgłoszenie jest już w moderacji — nie można go teraz edytować.')
      navigate(ROUTES.games.detail(game!.id))
      return true
    }
    const field = FIELD_BY_ERROR_CODE[code]
    if (!field) return false
    setError(field, { message: errorMessage(error, code) })
    return true
  }

  const save = (sendToModeration: boolean) =>
    submit(async (values) => {
      const parsed = gameSubmissionSchema.parse(values)
      const dto = toRequestDto(parsed)

      if (editing) {
        await updateGame(game.id, dto)
        if (sendToModeration) await submitGame(game.id)
        toast.success(sendToModeration ? 'Zgłoszenie wysłane do moderacji.' : 'Zapisano zmiany.')
        navigate(ROUTES.games.detail(game.id))
        return
      }

      const created = await createGame(dto, sendToModeration)
      toast.success(
        sendToModeration ? 'Zgłoszenie wysłane do moderacji.' : 'Szkic zapisany — możesz wrócić do niego później.',
      )
      navigate(ROUTES.games.detail(created.id))
    }, handleDomainError)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">
          {editing ? 'Edycja zgłoszenia' : 'Zgłoś grę'}
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Zgłoszenie trafia do moderatora — po zatwierdzeniu gra pojawia się w bibliotece dla
          wszystkich.
        </p>
      </header>

      {locked && (
        <Card className="bg-error-container">
          <p className="text-sm text-on-error-container">
            To zgłoszenie czeka na decyzję moderatora albo jest już w bibliotece — edycja jest
            zablokowana.
          </p>
        </Card>
      )}

      <form className="space-y-6" onSubmit={save(false)}>
        <Section title="Podstawy">
          <div className="space-y-4">
            <Input label="Tytuł" error={errors.title?.message} {...register('title')} />
            <Textarea
              label="Opis"
              hint="Co to za gra i o co w niej chodzi"
              error={errors.description?.message}
              {...register('description')}
            />
            <Input
              label="URL okładki"
              hint="Backend przechowuje adres obrazka, nie plik — wklej link"
              error={errors.coverImageUrl?.message}
              {...register('coverImageUrl')}
            />
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Podgląd okładki"
                className="h-32 w-32 rounded-2xl bg-surface-variant object-cover"
              />
            )}
          </div>
        </Section>

        <Section title="Rozgrywka">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Min. graczy"
              type="number"
              min={1}
              error={errors.minPlayers?.message}
              {...register('minPlayers')}
            />
            <Input
              label="Maks. graczy"
              type="number"
              min={1}
              error={errors.maxPlayers?.message}
              {...register('maxPlayers')}
            />
            <Input
              label="Czas gry (min)"
              type="number"
              min={1}
              error={errors.playingTimeMinutes?.message}
              {...register('playingTimeMinutes')}
            />
            <Input
              label="Rok wydania"
              type="number"
              min={1900}
              error={errors.yearPublished?.message}
              {...register('yearPublished')}
            />
            <Input
              label="Wiek gracza"
              type="number"
              min={0}
              max={21}
              error={errors.minAge?.message}
              {...register('minAge')}
            />
          </div>
        </Section>

        <Section title="Wydawcy i autorzy">
          <div className="space-y-4">
            <Controller
              control={control}
              name="publishers"
              render={({ field }) => (
                <Combobox
                  label="Wydawcy"
                  value={field.value}
                  onChange={field.onChange}
                  fetchOptions={fetchPublishers}
                  allowCreate
                  placeholder="Zacznij pisać nazwę wydawcy"
                  hint="Nowy wydawca zostanie utworzony razem ze zgłoszeniem i zatwierdzony wraz z grą"
                  error={errors.publishers?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="authors"
              render={({ field }) => (
                <Combobox
                  label="Autorzy"
                  value={field.value}
                  onChange={field.onChange}
                  fetchOptions={fetchAuthors}
                  allowCreate
                  placeholder="np. Uwe Rosenberg"
                  hint="Nowego autora podaj jako imię i nazwisko"
                  error={errors.authors?.message}
                />
              )}
            />
          </div>
        </Section>

        <Section title="Kategorie i mechaniki">
          <div className="space-y-4">
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <fieldset>
                  <legend className="px-1 pb-2 text-sm font-semibold text-on-surface-variant">
                    Kategorie
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        selected={field.value.includes(category.id!)}
                        onClick={() =>
                          field.onChange(
                            field.value.includes(category.id!)
                              ? field.value.filter((id) => id !== category.id)
                              : [...field.value, category.id!],
                          )
                        }
                      >
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                  {errors.categoryIds && (
                    <p role="alert" className="px-1 pt-2 text-xs font-medium text-error">
                      {errors.categoryIds.message}
                    </p>
                  )}
                </fieldset>
              )}
            />
            <Controller
              control={control}
              name="mechanicIds"
              render={({ field }) => (
                <fieldset>
                  <legend className="px-1 pb-2 text-sm font-semibold text-on-surface-variant">
                    Mechaniki
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {mechanics.map((mechanic) => (
                      <Chip
                        key={mechanic.id}
                        selected={field.value.includes(mechanic.id!)}
                        onClick={() =>
                          field.onChange(
                            field.value.includes(mechanic.id!)
                              ? field.value.filter((id) => id !== mechanic.id)
                              : [...field.value, mechanic.id!],
                          )
                        }
                      >
                        {mechanic.name}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              )}
            />
          </div>
        </Section>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" iconLeft="save" loading={isSubmitting} disabled={locked}>
            {editing ? 'Zapisz zmiany' : 'Zapisz szkic'}
          </Button>
          <Button
            type="button"
            iconLeft="send"
            loading={isSubmitting}
            disabled={locked}
            onClick={save(true)}
          >
            Wyślij do moderacji
          </Button>
          <ButtonLink
            to={editing ? ROUTES.games.detail(game.id) : ROUTES.games.library}
            variant="ghost"
          >
            Anuluj
          </ButtonLink>
        </div>
      </form>
    </div>
  )
}

/** Komunikat serwera, a gdy go brak — czytelny opis znanego kodu. */
function errorMessage(error: unknown, code: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as ApiError | undefined)?.message
    if (message) return message
  }
  return code
}

/** Ładowanie istniejącego zgłoszenia — osobny komponent, żeby tryb tworzenia
 *  w ogóle nie uruchamiał pobierania. */
function GameEditLoader({ gameId }: Readonly<{ gameId: number }>) {
  const fetchGame = useCallback(() => getGame(gameId), [gameId])
  const { state } = useResource(fetchGame)

  if (state.status === 'notFound') {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono zgłoszenia"
        description="Gra o tym adresie nie istnieje albo nie należy do Ciebie."
        action={
          <ButtonLink to={ROUTES.games.library} variant="secondary" iconLeft="arrow_back">
            Wróć do biblioteki
          </ButtonLink>
        }
      />
    )
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        icon="cloud_off"
        title="Nie udało się wczytać zgłoszenia"
        description="Sprawdź połączenie i spróbuj ponownie."
      />
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-3xl text-primary" label="Ładowanie zgłoszenia…" />
      </div>
    )
  }

  return <GameForm game={state.data} />
}

export default function GameFormPage() {
  const { id } = useParams<{ id: string }>()

  if (id === undefined) return <GameForm />

  const gameId = Number(id)
  if (!Number.isInteger(gameId) || gameId <= 0) {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono zgłoszenia"
        description="Gra o tym adresie nie istnieje albo nie należy do Ciebie."
        action={
          <ButtonLink to={ROUTES.games.library} variant="secondary" iconLeft="arrow_back">
            Wróć do biblioteki
          </ButtonLink>
        }
      />
    )
  }

  return <GameEditLoader gameId={gameId} />
}
