import { type KeyboardEvent, useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { Badge } from './Badge'
import { describedById } from './fieldDescription'
import { Icon } from './Icon'
import { Spinner } from './Spinner'

/** Podpowiedź z backendu albo pozycja utworzona z wpisanego tekstu. */
export interface ComboboxItem {
  /** Id wpisu w słowniku; brak = pozycja tworzona w locie z wpisanej nazwy. */
  id?: number
  label: string
  /** Wpis czekający na zatwierdzenie moderatora — wymaga oznaczenia w UI. */
  pending?: boolean
}

interface ComboboxProps {
  label: string
  /** Wybrane pozycje. Komponent jest w pełni kontrolowany. */
  value: ComboboxItem[]
  onChange: (items: ComboboxItem[]) => void
  /** Źródło podpowiedzi; wołane po przerwie w pisaniu. */
  fetchOptions: (query: string) => Promise<ComboboxItem[]>
  /** Czy z wpisanego tekstu można utworzyć nową pozycję (wydawcy, autorzy — tak; kategorie — nie). */
  allowCreate?: boolean
  /** Wybór pojedynczy: nowy wybór zastępuje poprzedni (np. gra bazowa dodatku). */
  single?: boolean
  /** Pole tylko do odczytu — pokazuje wybór, ale nie pozwala go zmienić. */
  disabled?: boolean
  placeholder?: string
  hint?: string
  error?: string
}

/** Klucz listy: id ze słownika albo sama nazwa dla pozycji tworzonej w locie. */
function keyOf(item: ComboboxItem): string {
  return item.id !== undefined ? `id-${item.id}` : `new-${item.label.toLowerCase()}`
}

/**
 * Pole wielokrotnego wyboru z podpowiedziami z API.
 *
 * Podpowiedzi wydawców i autorów przychodzą we **wszystkich** statusach — wpis
 * `PENDING` jest oznaczony, bo inaczej użytkownik utworzyłby duplikat nazwy,
 * która już czeka na zatwierdzenie. Nowe pozycje (`allowCreate`) trafiają do
 * osobnych pól żądania (`newPublisherNames` / `newAuthors`), więc rozróżnienie
 * „istniejąca vs nowa" niesie samo `id`.
 */
export function Combobox({
  label,
  value,
  onChange,
  fetchOptions,
  allowCreate,
  single,
  disabled,
  placeholder,
  hint,
  error,
}: Readonly<ComboboxProps>) {
  const fieldId = useId()
  const listId = `${fieldId}-list`
  const [query, setQuery] = useState('')
  // Wynik trzymany razem z frazą, dla której powstał — dzięki temu „ładowanie"
  // i „podpowiedzi" są wyliczane, a nie ustawiane synchronicznie w efekcie.
  const [result, setResult] = useState<{ query: string; items: ComboboxItem[] }>({
    query: '',
    items: [],
  })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebouncedValue(query)

  const selectedKeys = useMemo(() => new Set(value.map(keyOf)), [value])

  useEffect(() => {
    const phrase = debouncedQuery.trim()
    if (phrase.length === 0) return
    let active = true
    fetchOptions(phrase)
      .then((items) => active && setResult({ query: phrase, items }))
      // Nieudane podpowiedzi nie mogą blokować pola — zostaje samo „utwórz".
      .catch(() => active && setResult({ query: phrase, items: [] }))
    return () => {
      active = false
    }
  }, [debouncedQuery, fetchOptions])

  const trimmed = query.trim()
  // Podpowiedzi pokazujemy tylko wtedy, gdy dotyczą aktualnie wpisanej frazy.
  const options = useMemo(
    () => (result.query === trimmed ? result.items : []),
    [result, trimmed],
  )
  const loading = trimmed.length > 0 && result.query !== trimmed
  const canCreate =
    allowCreate &&
    trimmed.length > 0 &&
    !options.some((option) => option.label.toLowerCase() === trimmed.toLowerCase()) &&
    !selectedKeys.has(`new-${trimmed.toLowerCase()}`)

  // Lista widoczna dla klawiatury: podpowiedzi bez już wybranych + ewentualne „utwórz".
  const visibleOptions = useMemo(
    () => options.filter((option) => !selectedKeys.has(keyOf(option))),
    [options, selectedKeys],
  )
  const entries: ComboboxItem[] = canCreate
    ? [...visibleOptions, { label: trimmed }]
    : visibleOptions

  const select = (item: ComboboxItem) => {
    if (single) onChange([item])
    else if (!selectedKeys.has(keyOf(item))) onChange([...value, item])
    setQuery('')
    setActiveIndex(-1)
    setOpen(false)
  }

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (entries.length === 0) return
      setOpen(true)
      setActiveIndex((current) => {
        const next = e.key === 'ArrowDown' ? current + 1 : current - 1
        return (next + entries.length) % entries.length
      })
      return
    }
    if (e.key === 'Enter') {
      // Enter nie może wysłać formularza, gdy lista jest otwarta.
      if (entries.length > 0) e.preventDefault()
      const chosen = entries[activeIndex] ?? (canCreate ? { label: trimmed } : undefined)
      if (chosen) select(chosen)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    // Backspace na pustym polu zdejmuje ostatni wybór — standard dla pól z chipami.
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      removeAt(value.length - 1)
    }
  }

  const describedBy = describedById(fieldId, error, hint)

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block px-1 text-sm font-semibold text-on-surface-variant">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((item, index) => (
            <li key={keyOf(item)}>
              <span className="inline-flex items-center gap-1 rounded-xl bg-primary-fixed px-2.5 py-1 text-sm font-semibold text-on-primary-fixed">
                {item.label}
                {item.id === undefined && <Badge tone="info">nowy</Badge>}
                {item.pending && <Badge tone="neutral">oczekuje</Badge>}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    aria-label={`Usuń: ${item.label}`}
                    className="rounded-full p-0.5 hover:bg-on-primary-fixed/10"
                  >
                    <Icon name="close" className="text-base" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          id={fieldId}
          role="combobox"
          aria-expanded={open && entries.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && entries[activeIndex] ? `${listId}-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            'block w-full rounded-2xl border-0 bg-surface-container-low px-4 py-3.5 text-on-surface',
            'placeholder:text-on-surface-variant/50 transition-all duration-300',
            'focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary',
            error && 'bg-error-container/20 ring-2 ring-error/50 focus:ring-error',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
        {loading && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4">
            <Spinner className="text-lg text-primary" label="Szukanie podpowiedzi…" />
          </span>
        )}

        {open && entries.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl bg-surface-container-lowest p-1 shadow-ambient"
          >
            {entries.map((item, index) => (
              <li
                key={keyOf(item)}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // Wybór na mousedown: klik nie zdąży najpierw zabrać fokusu polu.
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(item)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm',
                  index === activeIndex ? 'bg-surface-container-high' : 'hover:bg-surface-container',
                )}
              >
                {item.id === undefined ? (
                  <>
                    <Icon name="add" className="text-base text-primary" aria-hidden="true" />
                    Utwórz: <span className="font-semibold">{item.label}</span>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.pending && <Badge tone="neutral">oczekuje na zatwierdzenie</Badge>}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="px-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId}-hint`} className="px-1 text-xs text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
