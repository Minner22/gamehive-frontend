import type { Role } from '@/api/types'

/** Role możliwe do przypisania w panelu admina (pełny zbiór zastępuje poprzedni). */
export const ASSIGNABLE_ROLES: Role[] = ['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN']

const ROLE_LABELS: Record<string, string> = {
  ROLE_USER: 'Użytkownik',
  ROLE_MODERATOR: 'Moderator',
  ROLE_ADMIN: 'Administrator',
}

/** Czytelna etykieta roli; w razie nieznanej — bez prefiksu ROLE_. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/^ROLE_/, '')
}

/**
 * Role do pokazania użytkownikowi: bez domyślnej ROLE_USER (zakładana dla każdego)
 * i bez prefiksu ROLE_ (np. ROLE_ADMIN → ADMIN).
 */
export function displayRoles(roles: readonly string[] | undefined): string[] {
  return (roles ?? [])
    .filter((role) => role !== 'ROLE_USER')
    .map((role) => role.replace(/^ROLE_/, ''))
}
