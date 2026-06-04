import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import InstallerDailyList from '../components/installer/InstallerDailyList'

export default function InstallerDashboard() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-emerald-400 text-sm">Kostone Marble</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">{username}</span>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-slate-500 text-xs px-2 py-1 rounded border border-slate-700"
            >
              יציאה
            </button>
          </div>
        </div>
      </header>
      <InstallerDailyList />
    </div>
  )
}
