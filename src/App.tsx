import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/auth/AuthProvider'
import { MedicineProvider } from './services/medicine/MedicineProvider'
import { ToastProvider } from './components/toast/ToastProvider'
import { RequireAuth } from './pages/routes/RequireAuth'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { UploadPage } from './pages/Upload/UploadPage'
import { ExtractedDataPage } from './pages/Extracted/ExtractedDataPage'
import { AISuggestionsPage } from './pages/AISuggestions/AISuggestionsPage'
import { ReminderSettingsPage } from './pages/Reminders/ReminderSettingsPage'
import { AppLayout } from './components/layout/AppLayout'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { AuthenticatedReminderRunner } from './components/reminders/AuthenticatedReminderRunner'

function AppRoutes() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: 'var(--mm-bg)' }}
      >
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/auth'} replace />}
      />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AppLayout stickyTopNav>
              <DashboardPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/upload"
        element={
          <RequireAuth>
            <AppLayout>
              <UploadPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/extracted"
        element={
          <RequireAuth>
            <AppLayout>
              <ExtractedDataPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/ai-suggestions"
        element={
          <RequireAuth>
            <AppLayout>
              <AISuggestionsPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/reminders"
        element={
          <RequireAuth>
            <AppLayout>
              <ReminderSettingsPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/auth'} replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MedicineProvider>
          <AuthenticatedReminderRunner />
          <AppRoutes />
        </MedicineProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

