/**
 * Id elementu opisującego pole (`aria-describedby`): komunikat błędu ma
 * pierwszeństwo przed podpowiedzią, bo pokazujemy tylko jeden z nich naraz.
 *
 * Wspólne dla Input, Textarea i Combobox — inaczej ten sam warunek żyłby
 * w trzech miejscach jako zagnieżdżony ternary.
 */
export function describedById(
  fieldId: string,
  error?: string,
  hint?: string,
): string | undefined {
  if (error) return `${fieldId}-error`
  if (hint) return `${fieldId}-hint`
  return undefined
}
