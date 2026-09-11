import { type SubmitEvent, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { taxonomyErrorMessage } from '@/lib/taxonomyErrors'

export interface DictionaryField {
  key: string
  label: string
}

interface DictionaryEntryFormProps {
  /** Pola wpisu — wydawca i kategoria mają jedno (nazwa), autor dwa (imię i nazwisko). */
  fields: readonly DictionaryField[]
  initialValues?: Record<string, string>
  submitLabel: string
  /** Rzuca przy błędzie — formularz sam pokaże komunikat. */
  onSubmit: (values: Record<string, string>) => Promise<void>
  /** Obecne w edycji; w dodawaniu formularz po sukcesie po prostu się czyści. */
  onCancel?: () => void
}

function emptyValues(fields: readonly DictionaryField[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.key, '']))
}

/** Wspólny formularz dodawania i edycji wpisu słownika — dla wszystkich czterech zakładek. */
export function DictionaryEntryForm({
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Readonly<DictionaryEntryFormProps>) {
  const [values, setValues] = useState<Record<string, string>>(
    () => initialValues ?? emptyValues(fields),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    // Backend odrzuca puste i białe znaki (400) — mówimy o tym przed wysłaniem.
    const blank = fields.find((field) => (values[field.key] ?? '').trim() === '')
    if (blank) {
      setError(`Uzupełnij pole „${blank.label}".`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(
        Object.fromEntries(fields.map((field) => [field.key, values[field.key].trim()])),
      )
      if (!onCancel) setValues(emptyValues(fields))
    } catch (err) {
      setError(taxonomyErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        {fields.map((field) => (
          <div key={field.key} className="min-w-40 flex-1">
            <Input
              label={field.label}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((current) => ({ ...current, [field.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button type="submit" size="sm" iconLeft={onCancel ? 'save' : 'add'} loading={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Anuluj
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="px-1 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </form>
  )
}
