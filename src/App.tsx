import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import AuthLayout from '@/components/layout/AuthLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfilePage from '@/pages/ProfilePage'
import UiKitPage from '@/pages/UiKitPage'
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
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.uiKit} element={<UiKitPage />} />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
