/**
 * Nowi autorzy trafiają do API jako para `{ firstName, lastName }`, a w polu
 * z podpowiedziami użytkownik wpisuje jeden ciąg („Uwe Rosenberg").
 *
 * Dzielimy na **pierwszej** spacji: wszystko po niej jest nazwiskiem, więc
 * „Klaus-Jürgen Wrede" i „Ludwig van Beethoven" wychodzą poprawnie.
 */
export interface AuthorName {
  firstName: string
  lastName: string
}

/** Zwraca `null`, gdy nie da się wskazać nazwiska (brak spacji). */
export function splitAuthorName(fullName: string): AuthorName | null {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const separator = trimmed.indexOf(' ')
  if (separator <= 0) return null
  return {
    firstName: trimmed.slice(0, separator),
    lastName: trimmed.slice(separator + 1),
  }
}

export function formatAuthorName(author: { firstName?: string; lastName?: string }): string {
  return [author.firstName, author.lastName].filter(Boolean).join(' ')
}
