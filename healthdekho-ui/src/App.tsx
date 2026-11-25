import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage, PaymentPage, PolicySearchPage, ProductDiscoveryPage } from './pages/WorkspacePages'
import './App.css'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/payment"
        element={<ProtectedRoute><PaymentPage /></ProtectedRoute>}
      />
      <Route
        path="/products"
        element={<ProtectedRoute><ProductDiscoveryPage /></ProtectedRoute>}
      />
      <Route
        path="/search"
        element={<ProtectedRoute><PolicySearchPage /></ProtectedRoute>}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
