/**
 * Role do pokazania użytkownikowi: bez domyślnej ROLE_USER (zakładana dla każdego)
 * i bez prefiksu ROLE_ (np. ROLE_ADMIN → ADMIN).
 */
export function displayRoles(roles: readonly string[] | undefined): string[] {
  return (roles ?? [])
    .filter((role) => role !== 'ROLE_USER')
    .map((role) => role.replace(/^ROLE_/, ''))
}
