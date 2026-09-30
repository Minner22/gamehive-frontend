import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import AuthLayout from '@/components/layout/AuthLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomeRoute from '@/pages/HomeRoute'
import { ROUTES } from '@/routes/paths'

/**
 * Ekrany ładowane razem z trasą (`React.lazy`), więc pierwsze wejście nie ściąga
 * kodu wszystkich widoków naraz. Granice `Suspense` siedzą w layoutach (`AppShell`,
 * `AuthLayout`) wokół `<Outlet />` — szkielet z nawigacją nie miga przy przejściu.
 *
 * `HomeRoute` zostaje statycznie: to trasa `/`, więc jej kod i tak jest potrzebny
 * natychmiast, a osobny plik oznaczałby tylko dodatkowe żądanie na starcie.
 *
 * `ProtectedRoute` jest **na zewnątrz** `lazy`: najpierw rozstrzygamy dostęp, potem
 * ściągamy kod ekranu. Inaczej niezalogowany pobierałby panel admina tylko po to,
 * żeby zobaczyć przekierowanie.
 */
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const ProfileEditPage = lazy(() => import('@/pages/ProfileEditPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const UiKitPage = lazy(() => import('@/pages/UiKitPage'))

const ExpansionDetailPage = lazy(() => import('@/pages/games/ExpansionDetailPage'))
const ExpansionFormPage = lazy(() => import('@/pages/games/ExpansionFormPage'))
const ExpansionsLibraryPage = lazy(() => import('@/pages/games/ExpansionsLibraryPage'))
const GameDetailPage = lazy(() => import('@/pages/games/GameDetailPage'))
const GameFormPage = lazy(() => import('@/pages/games/GameFormPage'))
const GamesLibraryPage = lazy(() => import('@/pages/games/GamesLibraryPage'))
const GameSearchPage = lazy(() => import('@/pages/games/GameSearchPage'))
const MySubmissionsPage = lazy(() => import('@/pages/games/MySubmissionsPage'))
const VaultPage = lazy(() => import('@/pages/games/VaultPage'))

const ExpansionModerationPage = lazy(() => import('@/pages/moderation/ExpansionModerationPage'))
const GameModerationPage = lazy(() => import('@/pages/moderation/GameModerationPage'))

const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage'))
const AdminSearchPage = lazy(() => import('@/pages/admin/AdminSearchPage'))
const AdminTaxonomyPage = lazy(() => import('@/pages/admin/AdminTaxonomyPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))

const ActivatePage = lazy(() => import('@/pages/auth/ActivatePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const PasswordResetConfirmPage = lazy(() => import('@/pages/auth/PasswordResetConfirmPage'))
const PasswordResetRequestPage = lazy(() => import('@/pages/auth/PasswordResetRequestPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))

const MODERATOR = ['ROLE_MODERATOR', 'ROLE_ADMIN'] as const

export default function App() {
  return (
    <Routes>
      {/* Ekrany publiczne / auth — bez nawigacji aplikacji */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.activate} element={<ActivatePage />} />
        <Route
          path={ROUTES.passwordResetRequest}
          element={<PasswordResetRequestPage />}
        />
        <Route
          path={ROUTES.passwordResetConfirm}
          element={<PasswordResetConfirmPage />}
        />
      </Route>

      {/* Aplikacja — szkielet z nawigacją */}
      <Route element={<AppShell />}>
        <Route path={ROUTES.home} element={<HomeRoute />} />
        <Route path={ROUTES.uiKit} element={<UiKitPage />} />
        <Route
          path={ROUTES.dashboard}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.library}
          element={
            <ProtectedRoute>
              <GamesLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.search}
          element={
            <ProtectedRoute>
              <GameSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.my}
          element={
            <ProtectedRoute>
              <MySubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.new}
          element={
            <ProtectedRoute>
              <GameFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.editPattern}
          element={
            <ProtectedRoute>
              <GameFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.games.detailPattern}
          element={
            <ProtectedRoute>
              <GameDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.expansions.library}
          element={
            <ProtectedRoute>
              <ExpansionsLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.expansions.new}
          element={
            <ProtectedRoute>
              <ExpansionFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.expansions.editPattern}
          element={
            <ProtectedRoute>
              <ExpansionFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.expansions.detailPattern}
          element={
            <ProtectedRoute>
              <ExpansionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.vault}
          element={
            <ProtectedRoute>
              <VaultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.profileEdit}
          element={
            <ProtectedRoute>
              <ProfileEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.moderation.games}
          element={
            <ProtectedRoute role={[...MODERATOR]}>
              <GameModerationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.moderation.expansions}
          element={
            <ProtectedRoute role={[...MODERATOR]}>
              <ExpansionModerationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.moderation.editGamePattern}
          element={
            <ProtectedRoute role={[...MODERATOR]}>
              <GameFormPage mode="moderator" />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.moderation.editExpansionPattern}
          element={
            <ProtectedRoute role={[...MODERATOR]}>
              <ExpansionFormPage mode="moderator" />
            </ProtectedRoute>
          }
        />
        {/* Reindeks to narzędzie moderacji treści, nie administracja kontami. */}
        <Route
          path={ROUTES.admin.search}
          element={
            <ProtectedRoute role={[...MODERATOR]}>
              <AdminSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.admin.users}
          element={
            <ProtectedRoute role="ROLE_ADMIN">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.admin.taxonomy}
          element={
            <ProtectedRoute role="ROLE_ADMIN">
              <AdminTaxonomyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.admin.audit}
          element={
            <ProtectedRoute role="ROLE_ADMIN">
              <AdminAuditPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
