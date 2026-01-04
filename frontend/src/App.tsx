import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LandingPage } from './components/common/LandingPage'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Login } from './components/auth/Login'
import { Register } from './components/auth/Register'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { HomePage } from './components/dashboard/HomePage'
import { ExtractionsPage } from './components/dashboard/ExtractionsPage'
import { ExtractionDetailPage } from './components/dashboard/ExtractionDetailPage'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HomePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/extractions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExtractionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/extractions/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExtractionDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

