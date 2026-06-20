/**
 * Jedyne źródło prawdy o motywie jasny/ciemny.
 *
 * Stan = obecność klasy `.dark` na <html>. Wstępnie ustawia ją skrypt w
 * index.html (przed pierwszym malowaniem — brak migotania); ten moduł
 * synchronizuje wszystkie instancje UI (np. ThemeToggle) przez external store.
 *
 * Uwaga: klucz STORAGE_KEY jest zduplikowany w inline-skrypcie index.html —
 * tamten musi działać przed załadowaniem bundla, więc nie może importować
 * z tego modułu. Przy zmianie klucza zaktualizuj oba miejsca.
 */
const STORAGE_KEY = 'theme'

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/** Aktualny stan motywu odczytany z klasy na <html>. */
export function isDark(): boolean {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark')
  }
  return prefersDark()
}

const listeners = new Set<() => void>()

/** Ustawia motyw: klasa na <html> + zapis w localStorage + powiadomienie. */
export function setDark(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  } catch {
    /* localStorage niedostępny — pomijamy zapis */
  }
  listeners.forEach((l) => l())
}

export function toggleTheme(): void {
  setDark(!isDark())
}

/** Subskrypcja zmian motywu (w obrębie strony i między kartami). */
export function subscribeTheme(callback: () => void): () => void {
  listeners.add(callback)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      document.documentElement.classList.toggle('dark', e.newValue === 'dark')
      callback()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}
