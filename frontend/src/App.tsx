import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/consultant" replace />} />
        <Route path="/consultant/*" element={<div>לוח בקרה - יועץ</div>} />
        <Route path="/hotman/*" element={<div>לוח בקרה - מנהל מפעל</div>} />
        <Route path="/installer/*" element={<div>לוח בקרה - מתקין</div>} />
        <Route path="/portal/*" element={<div>פורטל לקוח</div>} />
        <Route path="/login" element={<div>כניסה למערכת</div>} />
      </Routes>
    </BrowserRouter>
  )
}
