import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerPortalShell from './components/portal/CustomerPortalShell'
import PortalMagicLinkVerify from './pages/PortalMagicLinkVerify'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/consultant" replace />} />
        <Route path="/consultant/*" element={<div>לוח בקרה - יועץ</div>} />
        <Route path="/hotman/*" element={<div>לוח בקרה - מנהל מפעל</div>} />
        <Route path="/installer/*" element={<div>לוח בקרה - מתקין</div>} />
        {/* Customer portal — uses magic-link JWT auth */}
        <Route path="/portal/auth" element={<PortalMagicLinkVerify />} />
        <Route path="/portal/*" element={<CustomerPortalShell />} />
        <Route path="/login" element={<div>כניסה למערכת</div>} />
      </Routes>
    </BrowserRouter>
  )
}
