import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Font ikon jest zawężony w `index.html` do listy `icon_names` (pełny waży 3,9 MB,
 * zawężony ~11 kB). Cena jest taka, że ikona użyta w kodzie, ale nieobecna na liście,
 * wyświetli się jako nazwa tekstem — i nikt tego nie zauważy do code review.
 *
 * Ten test zamienia tę pułapkę w czerwony test: skanuje kod po nazwach ikon
 * i porównuje je z listą w `index.html`.
 */

const SRC = join(process.cwd(), 'src')

/** Nazwa ikony w atrybucie (`<Icon name="x">`, `iconLeft="x"`) albo w konfiguracji (`icon: 'x'`). */
const ATTR = /(?:icon|iconLeft|iconRight|name)\s*[:=]\s*\{?\s*['"]([a-z][a-z_0-9]*)['"]/g
/** Wybór ikony w ternary: `name={dark ? 'light_mode' : 'dark_mode'}`. */
const TERNARY = /\?\s*['"]([a-z][a-z_0-9]*)['"]\s*:\s*['"]([a-z][a-z_0-9]*)['"]/g

/**
 * Słowa, które trafiają w ten sam wzorzec z atrybutu `name=` pól formularzy
 * i tablic konfiguracyjnych. Lista jest krótka i jawna — gdyby ktoś dodał ikonę
 * o takiej nazwie, test ją przemilczy, więc trzymamy tu tylko rzeczy oczywiste.
 */
const NOT_ICONS = new Set([
  'authors', 'publishers', 'categories', 'mechanics', 'name', 'title', 'description',
  'status', 'email', 'username', 'password', 'roles', 'games', 'expansions', 'game',
  'expansion', 'reason', 'theme', 'submit', 'button', 'q',
])

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    const isSource = /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')
    const isTest = entry.name.includes('.test.')
    return isSource && !isTest ? [path] : []
  })
}

function iconsUsedInCode(): Set<string> {
  const used = new Set<string>()
  for (const file of sourceFiles(SRC)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const low = line.toLowerCase()
      if (!low.includes('icon') && !low.includes('name=')) continue
      for (const [, icon] of line.matchAll(ATTR)) {
        if (!NOT_ICONS.has(icon)) used.add(icon)
      }
      if (low.includes('icon')) {
        for (const [, a, b] of line.matchAll(TERNARY)) {
          if (!NOT_ICONS.has(a)) used.add(a)
          if (!NOT_ICONS.has(b)) used.add(b)
        }
      }
    }
  }
  return used
}

function iconsInIndexHtml(): Set<string> {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
  const match = /icon_names=([a-z_0-9,]+)/.exec(html)
  if (!match) throw new Error('Brak parametru icon_names w index.html')
  return new Set(match[1].split(','))
}

describe('subset fontu ikon', () => {
  it('każda ikona użyta w kodzie jest w icon_names', () => {
    const declared = iconsInIndexHtml()
    const missing = [...iconsUsedInCode()].filter((icon) => !declared.has(icon)).sort()

    expect(
      missing,
      `Ikony użyte w kodzie, ale nieobecne w icon_names w index.html: ${missing.join(', ')}. ` +
        'Bez dopisania ich do listy wyświetlą się jako tekst.',
    ).toEqual([])
  })

  /** Nadmiar nic nie psuje, ale rośnie bez powodu — łatwiej usunąć od razu. */
  it('icon_names nie zawiera ikon, których kod już nie używa', () => {
    const used = iconsUsedInCode()
    const unused = [...iconsInIndexHtml()].filter((icon) => !used.has(icon)).sort()

    expect(unused, `Nieużywane ikony w icon_names: ${unused.join(', ')}`).toEqual([])
  })
})
