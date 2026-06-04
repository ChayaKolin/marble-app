import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const role = localStorage.getItem('role')
      if (role === 'SUPER_ADMIN_OWNER') navigate('/consultant')
      else if (role === 'FACTORY_MANAGER') navigate('/hotman')
      else navigate('/installer')
    } catch {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100">Kostone Marble</h1>
          <p className="text-slate-400 text-sm mt-2">מערכת ניהול הזמנות</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
              className="bg-slate-900 rounded-2xl border border-slate-700 p-8 space-y-5">
          <h2 className="text-slate-200 font-semibold text-center">כניסה למערכת</h2>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                         placeholder:text-slate-600"
              placeholder="consultant"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                       text-white font-medium text-sm disabled:opacity-50
                       disabled:cursor-wait transition-colors"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
