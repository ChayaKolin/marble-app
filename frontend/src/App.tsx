import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ConsultantDashboard from './pages/ConsultantDashboard'
import HotmanDashboard from './pages/HotmanDashboard'
import InstallerDashboard from './pages/InstallerDashboard'
import CustomerPortalShell from './components/portal/CustomerPortalShell'
import PortalMagicLinkVerify from './pages/PortalMagicLinkVerify'

function RoleRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { token, role: userRole } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (userRole !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HomeRedirect() {
  const { token, role } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (role === 'SUPER_ADMIN_OWNER') return <Navigate to="/consultant" replace />
  if (role === 'FACTORY_MANAGER')   return <Navigate to="/hotman" replace />
  if (role === 'INSTALLER')         return <Navigate to="/installer" replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/consultant/*" element={
        <RoleRoute role="SUPER_ADMIN_OWNER"><ConsultantDashboard /></RoleRoute>
      } />
      <Route path="/hotman/*" element={
        <RoleRoute role="FACTORY_MANAGER"><HotmanDashboard /></RoleRoute>
      } />
      <Route path="/installer/*" element={
        <RoleRoute role="INSTALLER"><InstallerDashboard /></RoleRoute>
      } />

      <Route path="/portal/auth" element={<PortalMagicLinkVerify />} />
      <Route path="/portal/*" element={<CustomerPortalShell />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
