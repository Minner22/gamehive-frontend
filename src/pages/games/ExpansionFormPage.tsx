import { useCallback, useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createExpansion,
  getExpansion,
  submitExpansion,
  updateExpansion,
} from '@/api/expansions'
import { getGame, searchGames } from '@/api/games'
import type { ApiError, GameDto, GameExpansionDto, GameExpansionRequestDto } from '@/api/types'
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
import { useApiForm } from '@/lib/useApiForm'
import { useResource } from '@/lib/useResource'
import { useTaxonomyOptions } from '@/lib/useTaxonomyOptions'
import { expansionSubmissionSchema, type ExpansionSubmissionInput } from '@/lib/validation'
import { ROUTES } from '@/routes/paths'

/** Kody domenowe backendu przypisane do pól, których naprawdę dotyczą. */
const FIELD_BY_ERROR_CODE: Record<string, keyof ExpansionSubmissionInput> = {
  BASE_GAME_REQUIRED: 'baseGame',
  BASE_GAME_NOT_APPROVED: 'baseGame',
  GAME_NOT_FOUND: 'baseGame',
  INVALID_PLAYER_COUNT: 'maxPlayers',
}

const EMPTY_FORM: ExpansionSubmissionInput = {
  baseGame: [],
  name: '',
  description: '',
  minPlayers: '',
  maxPlayers: '',
  playingTimeMinutes: '',
  minAge: '',
  categoryIds: [],
  mechanicIds: [],
}

const FORM_FIELDS = Object.keys(EMPTY_FORM)

function isEditable(expansion: GameExpansionDto): boolean {
  return expansion.moderationStatus === 'DRAFT' || expansion.moderationStatus === 'REJECTED'
}

function errorCodeOf(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data as ApiError | undefined)?.errorCode
}

function messageOf(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as ApiError | undefined)?.message
    if (message) return message
  }
  return fallback
}

/** `''` w polu nadpisania znaczy „dziedziczę" — do API leci wtedy `undefined`. */
function overrideValue(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

interface ExpansionFormProps {
  expansion?: GameExpansionDto
  /** Gra bazowa z adresu (`?baseGameId=`) — wejście z konkretnej gry. */
  presetBaseGameId?: number
}

function ExpansionForm({ expansion, presetBaseGameId }: Readonly<ExpansionFormProps>) {
  const navigate = useNavigate()
  const { categories, mechanics } = useTaxonomyOptions()
  const editing = expansion !== undefined
  const locked = editing && !isEditable(expansion)

  const form = useApiForm<ExpansionSubmissionInput>(
    {
      resolver: zodResolver(expansionSubmissionSchema),
      defaultValues: expansion
        ? {
            baseGame: [{ id: expansion.baseGameId, label: expansion.baseGameTitle }],
            name: expansion.name,
            description: expansion.description,
            minPlayers: expansion.minPlayers?.toString() ?? '',
            maxPlayers: expansion.maxPlayers?.toString() ?? '',
            playingTimeMinutes: expansion.playingTimeMinutes?.toString() ?? '',
            minAge: expansion.minAge?.toString() ?? '',
            categoryIds: expansion.categories
              .map((c) => c.id)
              .filter((id): id is number => id !== undefined),
            mechanicIds: expansion.mechanics
              .map((m) => m.id)
              .filter((id): id is number => id !== undefined),
          }
        : EMPTY_FORM,
      mode: 'onTouched',
    },
    FORM_FIELDS,
  )
  const {
    register,
    control,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    submit,
    toast,
    watch,
  } = form

  const baseGamePick = watch('baseGame')
  const baseGameId = baseGamePick[0]?.id ?? presetBaseGameId

  // Gra bazowa jest potrzebna do pokazania, co dodatek dziedziczy — i do sprawdzenia
  // `min <= max` na wartościach efektywnych, zanim zrobi to backend.
  const [baseGame, setBaseGame] = useState<GameDto | null>(null)
  useEffect(() => {
    if (baseGameId === undefined) return
    let active = true
    getGame(baseGameId)
      .then((game) => {
        if (!active) return
        setBaseGame(game)
        // Wejście z konkretnej gry: uzupełniamy pole, gdy jest jeszcze puste.
        if (baseGamePick.length === 0) {
          setValue('baseGame', [{ id: game.id, label: game.title }])
        }
      })
      .catch(() => active && setBaseGame(null))
    return () => {
      active = false
    }
  }, [baseGameId, baseGamePick.length, setValue])

  const fetchBaseGames = useCallback(
    async (query: string): Promise<ComboboxItem[]> =>
      // Indeks wyszukiwarki zawiera wyłącznie pozycje APPROVED, więc podpowiedzi
      // są z definicji poprawnymi grami bazowymi.
      (await searchGames({ q: query, targetType: 'GAME' }, { size: 10 })).content
        .map((result) => result.game)
        .filter((game): game is GameDto => game !== undefined)
        .map((game) => ({ id: game.id, label: game.title })),
    [],
  )

  const handleDomainError = (error: unknown): boolean => {
    const code = errorCodeOf(error)
    if (!code) return false
    if (code === 'EXPANSION_NOT_EDITABLE') {
      toast.error('Zgłoszenie jest już w moderacji — nie można go teraz edytować.')
      navigate(ROUTES.expansions.detail(expansion!.id))
      return true
    }
    const field = FIELD_BY_ERROR_CODE[code]
    if (!field) return false
    setError(field, { message: messageOf(error, code) })
    return true
  }

  const save = (sendToModeration: boolean) =>
    submit(async (values) => {
      const parsed = expansionSubmissionSchema.parse(values)

      // `min <= max` liczone na wartościach efektywnych: własne nadpisanie albo
      // wartość z gry bazowej. Backend sprawdza to samo i odpowiada 400.
      const effectiveMin = parsed.minPlayers ?? baseGame?.minPlayers
      const effectiveMax = parsed.maxPlayers ?? baseGame?.maxPlayers
      if (effectiveMin !== undefined && effectiveMax !== undefined && effectiveMin > effectiveMax) {
        setError('maxPlayers', {
          message: 'Po uwzględnieniu gry bazowej maksimum wychodzi mniejsze od minimum',
        })
        return
      }

      const dto: GameExpansionRequestDto = {
        baseGameId: parsed.baseGame[0]?.id,
        name: parsed.name,
        description: parsed.description,
        minPlayers: overrideValue(parsed.minPlayers),
        maxPlayers: overrideValue(parsed.maxPlayers),
        playingTimeMinutes: overrideValue(parsed.playingTimeMinutes),
        minAge: overrideValue(parsed.minAge),
        categoryIds: parsed.categoryIds,
        mechanicIds: parsed.mechanicIds,
      }

      if (editing) {
        await updateExpansion(expansion.id, dto)
        if (sendToModeration) await submitExpansion(expansion.id)
        toast.success(sendToModeration ? 'Zgłoszenie wysłane do moderacji.' : 'Zapisano zmiany.')
        navigate(ROUTES.expansions.detail(expansion.id))
        return
      }

      const created = await createExpansion(dto, sendToModeration)
      toast.success(
        sendToModeration ? 'Zgłoszenie wysłane do moderacji.' : 'Szkic zapisany.',
      )
      navigate(ROUTES.expansions.detail(created.id))
    }, handleDomainError)

  /** Podpowiedź pod polem nadpisania: co się stanie, gdy zostawimy je puste. */
  const inheritedHint = (value: number | undefined, unit = '') =>
    value === undefined
      ? 'Puste = wartość z gry bazowej'
      : `Puste = jak w grze bazowej: ${value}${unit}`

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">
          {editing ? 'Edycja dodatku' : 'Zgłoś dodatek'}
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Wypełnij tylko to, co dodatek zmienia — resztę przejmie po grze bazowej.
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
        <Section title="Gra bazowa">
          <Controller
            control={control}
            name="baseGame"
            render={({ field }) => (
              <Combobox
                label="Gra bazowa"
                value={field.value}
                onChange={field.onChange}
                fetchOptions={fetchBaseGames}
                single
                disabled={editing}
                placeholder="Zacznij pisać tytuł gry"
                hint={
                  editing
                    ? 'Gry bazowej nie da się zmienić — zmiana bazy zmienia wszystkie dziedziczone wartości, więc to nowe zgłoszenie'
                    : 'Podpowiadamy wyłącznie gry zatwierdzone — tylko takie mogą mieć dodatki'
                }
                error={errors.baseGame?.message}
              />
            )}
          />
        </Section>

        <Section title="Podstawy">
          <div className="space-y-4">
            <Input label="Nazwa dodatku" error={errors.name?.message} {...register('name')} />
            <Textarea
              label="Opis"
              hint="Co dodatek wnosi do gry bazowej"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </Section>

        <Section title="Nadpisania">
          <p className="mb-4 text-sm text-on-surface-variant">
            Pola zostawione puste dodatek dziedziczy z gry bazowej. Wypełnij tylko te, które
            faktycznie zmienia.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Min. graczy"
              type="number"
              min={1}
              placeholder={baseGame ? String(baseGame.minPlayers) : undefined}
              hint={inheritedHint(baseGame?.minPlayers)}
              error={errors.minPlayers?.message}
              {...register('minPlayers')}
            />
            <Input
              label="Maks. graczy"
              type="number"
              min={1}
              placeholder={baseGame ? String(baseGame.maxPlayers) : undefined}
              hint={inheritedHint(baseGame?.maxPlayers)}
              error={errors.maxPlayers?.message}
              {...register('maxPlayers')}
            />
            <Input
              label="Czas gry (min)"
              type="number"
              min={1}
              placeholder={baseGame ? String(baseGame.playingTimeMinutes) : undefined}
              hint={inheritedHint(baseGame?.playingTimeMinutes, ' min')}
              error={errors.playingTimeMinutes?.message}
              {...register('playingTimeMinutes')}
            />
            <Input
              label="Wiek gracza"
              type="number"
              min={0}
              max={21}
              placeholder={baseGame ? String(baseGame.minAge) : undefined}
              hint={inheritedHint(baseGame?.minAge, '+')}
              error={errors.minAge?.message}
              {...register('minAge')}
            />
          </div>
        </Section>

        <Section title="Kategorie i mechaniki">
          <p className="mb-4 text-sm text-on-surface-variant">
            Nic nie zaznaczaj, jeśli dodatek zostaje przy kategoriach i mechanikach gry bazowej.
          </p>
          <div className="space-y-4">
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <fieldset>
                  <legend className="px-1 pb-2 text-sm font-semibold text-on-surface-variant">
                    Własne kategorie
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
                </fieldset>
              )}
            />
            <Controller
              control={control}
              name="mechanicIds"
              render={({ field }) => (
                <fieldset>
                  <legend className="px-1 pb-2 text-sm font-semibold text-on-surface-variant">
                    Własne mechaniki
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
          <Button
            type="submit"
            variant="secondary"
            iconLeft="save"
            loading={isSubmitting}
            disabled={locked}
          >
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
            to={editing ? ROUTES.expansions.detail(expansion.id) : ROUTES.expansions.library}
            variant="ghost"
          >
            Anuluj
          </ButtonLink>
        </div>
      </form>
    </div>
  )
}

/** Ładowanie istniejącego zgłoszenia — osobno, żeby tryb tworzenia nic nie pobierał. */
function ExpansionEditLoader({ expansionId }: Readonly<{ expansionId: number }>) {
  const fetchExpansion = useCallback(() => getExpansion(expansionId), [expansionId])
  const { state } = useResource(fetchExpansion)

  if (state.status === 'notFound') {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono zgłoszenia"
        description="Dodatek o tym adresie nie istnieje albo nie należy do Ciebie."
        action={
          <ButtonLink to={ROUTES.expansions.library} variant="secondary" iconLeft="arrow_back">
            Wróć do dodatków
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

  return <ExpansionForm expansion={state.data} />
}

export default function ExpansionFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  if (id === undefined) {
    const preset = Number(searchParams.get('baseGameId'))
    return (
      <ExpansionForm
        presetBaseGameId={Number.isInteger(preset) && preset > 0 ? preset : undefined}
      />
    )
  }

  const expansionId = Number(id)
  if (!Number.isInteger(expansionId) || expansionId <= 0) {
    return (
      <EmptyState
        icon="search_off"
        title="Nie znaleziono zgłoszenia"
        description="Dodatek o tym adresie nie istnieje albo nie należy do Ciebie."
        action={
          <ButtonLink to={ROUTES.expansions.library} variant="secondary" iconLeft="arrow_back">
            Wróć do dodatków
          </ButtonLink>
        }
      />
    )
  }

  return <ExpansionEditLoader expansionId={expansionId} />
}
