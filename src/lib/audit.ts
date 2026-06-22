export interface RoleChange {
  before: string[]
  after: string[]
}

/** details przy ROLE_CHANGE to JSON {before, after}; inaczej null (zwykły tekst). */
export function parseRoleChange(details?: string): RoleChange | null {
  if (!details) return null
  try {
    const parsed: unknown = JSON.parse(details)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as RoleChange).before) &&
      Array.isArray((parsed as RoleChange).after)
    ) {
      const { before, after } = parsed as RoleChange
      return { before, after }
    }
  } catch {
    /* nie JSON — traktujemy jako zwykły tekst */
  }
  return null
}

/** Role dodane (w after, brak w before) i usunięte (w before, brak w after). */
export function roleDiff(change: RoleChange): { added: string[]; removed: string[] } {
  return {
    added: change.after.filter((r) => !change.before.includes(r)),
    removed: change.before.filter((r) => !change.after.includes(r)),
  }
}
