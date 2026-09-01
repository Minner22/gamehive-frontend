/** Centralne stałe ścieżek aplikacji — jedno źródło prawdy dla linków i tras. */
export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  activate: '/activate',
  passwordResetRequest: '/password-reset',
  passwordResetConfirm: '/password-reset/confirm',
  profile: '/profile',
  profileEdit: '/profile/edit',
  uiKit: '/ui',
  /**
   * Moduł gier. `*Pattern` to wzorce dla <Route path>, pozostałe pola budują
   * konkretny adres — dzięki temu wzorzec i link nigdy się nie rozjeżdżają.
   */
  games: {
    library: '/games',
    search: '/games/search',
    my: '/games/my',
    new: '/games/new',
    detailPattern: '/games/:id',
    detail: (id: number | string) => `/games/${id}`,
    editPattern: '/games/:id/edit',
    edit: (id: number | string) => `/games/${id}/edit`,
  },
  expansions: {
    library: '/expansions',
    new: '/expansions/new',
    detailPattern: '/expansions/:id',
    detail: (id: number | string) => `/expansions/${id}`,
    editPattern: '/expansions/:id/edit',
    edit: (id: number | string) => `/expansions/${id}/edit`,
  },
  /** Prywatna kolekcja użytkownika („The Vault"). */
  vault: '/vault',
  /** Panel moderatora — wymaga roli MODERATOR lub ADMIN. */
  moderation: {
    games: '/moderation/games',
    expansions: '/moderation/expansions',
  },
  admin: {
    users: '/admin/users',
    audit: '/admin/audit',
    taxonomy: '/admin/taxonomy',
    search: '/admin/search',
  },
} as const