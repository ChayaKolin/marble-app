import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import SlaAlertDeck from '../components/hotman/SlaAlertDeck'
import HotmanCalendar from '../components/hotman/HotmanCalendar'
import CalendarPreviewStrip from '../components/hotman/CalendarPreviewStrip'

type Tab = 'sla' | 'calendar'

export default function HotmanDashboard() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('sla')

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="font-bold text-emerald-400 text-sm">Kostone Marble — מפעל</span>
          <nav className="flex gap-1 flex-1">
            {([['sla','לוח SLA'],['calendar','לוח שנה']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  tab === id ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">{username}</span>
            <button onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded border border-slate-700">
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {tab === 'sla' && (
          <>
            <CalendarPreviewStrip />
            <SlaAlertDeck />
          </>
        )}
        {tab === 'calendar' && <HotmanCalendar />}
      </main>
    </div>
  )
}
