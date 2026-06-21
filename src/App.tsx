import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import AuthLayout from '@/components/layout/AuthLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardPage from '@/pages/DashboardPage'
import HomeRoute from '@/pages/HomeRoute'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfileEditPage from '@/pages/ProfileEditPage'
import ProfilePage from '@/pages/ProfilePage'
import UiKitPage from '@/pages/UiKitPage'
import AdminAuditPage from '@/pages/admin/AdminAuditPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import ActivatePage from '@/pages/auth/ActivatePage'
import LoginPage from '@/pages/auth/LoginPage'
import PasswordResetConfirmPage from '@/pages/auth/PasswordResetConfirmPage'
import PasswordResetRequestPage from '@/pages/auth/PasswordResetRequestPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import { ROUTES } from '@/routes/paths'

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
          path={ROUTES.admin.users}
          element={
            <ProtectedRoute role="ROLE_ADMIN">
              <AdminUsersPage />
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
