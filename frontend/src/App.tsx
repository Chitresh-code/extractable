import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/common/Layout'
import { LandingPage } from './components/common/LandingPage'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Login } from './components/auth/Login'
import { Register } from './components/auth/Register'
import { ExtractionForm } from './components/extraction/ExtractionForm'
import { ResultsDisplay } from './components/extraction/ResultsDisplay'
import { History } from './components/extraction/History'
import { useState } from 'react'
import type { Extraction } from './types'

function Home() {
  const [currentExtraction, setCurrentExtraction] = useState<Extraction | null>(null)

  return (
    <div className="space-y-8">
      <ExtractionForm onSuccess={setCurrentExtraction} />
      {currentExtraction && (
        <div id="extraction-results">
          <ResultsDisplay extraction={currentExtraction} />
        </div>
      )}
      <History onViewExtraction={setCurrentExtraction} />
    </div>
  )
}

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
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <>
                <LandingPage />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

