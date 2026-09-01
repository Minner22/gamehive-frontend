/**
 * Polska odmiana rzeczownika po liczbie: 1 gra, 2 gry, 5 gier.
 *
 * Liczniki list wcześniej obchodziły temat zapisem „wpis(ów)"; przy siatce gier
 * to widać od razu, więc lepiej odmienić naprawdę. Reguła: 1 → forma pojedyncza,
 * końcówki 2–4 (poza nastkami 12–14) → forma „few", reszta → „many".
 */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count)
  if (abs === 1) return one
  const lastTwo = abs % 100
  const last = abs % 10
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few
  return many
}
