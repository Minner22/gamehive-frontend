/** Centralne stałe ścieżek aplikacji — jedno źródło prawdy dla linków i tras. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  activate: '/activate',
  passwordResetRequest: '/password-reset',
  passwordResetConfirm: '/password-reset/confirm',
  profile: '/profile',
  profileEdit: '/profile/edit',
  uiKit: '/ui',
  admin: {
    users: '/admin/users',
    audit: '/admin/audit',
  },
} as const