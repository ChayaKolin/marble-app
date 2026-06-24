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
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden" dir="rtl">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
          <button onClick={() => setTab('sla')}
            className="font-bold text-emerald-400 text-xs sm:text-sm shrink-0 truncate hover:text-emerald-300 transition-colors">
            Kostone Marble — מפעל
          </button>
          <nav className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
            {([['sla','לוח SLA'],['calendar','לוח שנה']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`shrink-0 whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                  tab === id ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 text-xs hidden sm:inline">{username}</span>
            <button onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 shrink-0">
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
