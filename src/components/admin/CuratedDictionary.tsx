import { useState } from 'react'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { Button, EmptyState, Section, Spinner, useToast } from '@/components/ui'
import { useResource } from '@/lib/useResource'
import { DeleteEntryButton } from './DeleteEntryButton'
import { DictionaryEntryForm } from './DictionaryEntryForm'

type CuratedItem = CategoryDto | MechanicDto

const NAME_FIELD = [{ key: 'name', label: 'Nazwa' }] as const

interface CuratedDictionaryProps {
  /** Nagłówek sekcji listy, np. „Kategorie". */
  title: string
  /** Etykieta przycisku dodawania, np. „Dodaj kategorię". */
  addLabel: string
  /** Musi być stabilne — zmiana tożsamości to ponowne pobranie listy. */
  list: () => Promise<CuratedItem[]>
  create: (name: string) => Promise<unknown>
  rename: (id: number, name: string) => Promise<unknown>
  remove: (id: number) => Promise<void>
}

/**
 * Słownik kuratorowany (kategorie, mechaniki): krótka, pełna lista bez stronicowania.
 * Po każdej zmianie lista jest pobierana na nowo — kolejność wyznacza backend, a przy
 * kilkunastu pozycjach to tańsze niż ręczne przestawianie.
 */
export function CuratedDictionary({
  title,
  addLabel,
  list,
  create,
  rename,
  remove,
}: Readonly<CuratedDictionaryProps>) {
  const toast = useToast()
  const { state, reload } = useResource(list)
  const [editingId, setEditingId] = useState<number | null>(null)

  const items = state.status === 'ok' ? state.data.filter((item) => item.id !== undefined) : []

  return (
    <div className="space-y-6">
      <Section title={addLabel}>
        <DictionaryEntryForm
          fields={NAME_FIELD}
          submitLabel="Dodaj"
          onSubmit={async ({ name }) => {
            await create(name)
            toast.success('Dodano do słownika.')
            reload()
          }}
        />
      </Section>

      <Section title={title}>
        {state.status === 'loading' && (
          <div className="flex justify-center py-6">
            <Spinner className="text-2xl text-primary" label="Ładowanie słownika…" />
          </div>
        )}

        {(state.status === 'error' || state.status === 'notFound') && (
          <EmptyState
            icon="cloud_off"
            title="Nie udało się wczytać słownika"
            action={
              <Button variant="secondary" iconLeft="refresh" onClick={reload}>
                Spróbuj ponownie
              </Button>
            }
          />
        )}

        {state.status === 'ok' && items.length === 0 && (
          <EmptyState icon="list" title="Słownik jest pusty" />
        )}

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((item) => {
              const id = item.id as number
              return (
                <li key={id} className="rounded-2xl bg-surface-container-low p-3">
                  {editingId === id ? (
                    <DictionaryEntryForm
                      fields={NAME_FIELD}
                      initialValues={{ name: item.name ?? '' }}
                      submitLabel="Zapisz"
                      onCancel={() => setEditingId(null)}
                      onSubmit={async ({ name }) => {
                        await rename(id, name)
                        toast.success('Zmieniono nazwę.')
                        setEditingId(null)
                        reload()
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-on-surface">{item.name}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          iconLeft="edit"
                          onClick={() => setEditingId(id)}
                        >
                          Zmień nazwę
                        </Button>
                        <DeleteEntryButton
                          name={item.name ?? ''}
                          onDelete={async () => {
                            await remove(id)
                            toast.success('Usunięto ze słownika.')
                            reload()
                          }}
                        />
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}
