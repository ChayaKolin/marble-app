import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import AnalyticsDashboard from '../components/consultant/AnalyticsDashboard'
import ConsultantCalendar from '../components/consultant/ConsultantCalendar'
import TrashView from '../components/consultant/TrashView'
import ActivityLogView from '../components/consultant/ActivityLogView'
import CustomerList from '../components/consultant/CustomerList'
import OrderList from '../components/consultant/OrderList'

type Tab = 'analytics' | 'customers' | 'orders' | 'calendar' | 'trash' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'לוח בקרה' },
  { id: 'customers', label: 'לקוחות' },
  { id: 'orders',    label: 'הזמנות' },
  { id: 'calendar',  label: 'לוח שנה' },
  { id: 'trash',     label: 'פח אשפה' },
  { id: 'history',   label: 'היסטוריה' },
]

export default function ConsultantDashboard() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('customers')

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
          <span className="font-bold text-emerald-400 text-xs sm:text-sm shrink-0">Kostone Marble</span>
          <nav className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                  tab === t.id
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 text-xs hidden sm:inline">{username}</span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1
                         rounded border border-slate-700 hover:border-slate-500 shrink-0"
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {tab === 'analytics' && <AnalyticsDashboard />}
        {tab === 'customers' && <CustomerList />}
        {tab === 'orders'    && <OrderList />}
        {tab === 'calendar'  && <ConsultantCalendar />}
        {tab === 'trash'     && <TrashView />}
        {tab === 'history'   && <ActivityLogView />}
      </main>
    </div>
  )
}
