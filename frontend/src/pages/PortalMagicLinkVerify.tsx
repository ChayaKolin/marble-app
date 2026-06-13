import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function PortalMagicLinkVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    axios.get<{ accessToken: string }>(`/api/v1/portal/auth/verify?token=${token}`)
      .then(res => {
        // Store JWT and redirect to portal — the axios request interceptor attaches
        // it from localStorage for every /portal/* request
        localStorage.setItem('portal_token', res.data.accessToken)
        navigate('/portal', { replace: true })
      })
      .catch(() => setStatus('error'))
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-3">
        {status === 'verifying' ? (
          <>
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent
                            rounded-full animate-spin mx-auto" />
            <p className="text-slate-300 text-sm">מאמת גישה...</p>
          </>
        ) : (
          <>
            <p className="text-red-400 text-sm">הקישור אינו תקין או שפג תוקפו</p>
            <p className="text-slate-500 text-xs">פנה ל-Kostone Marble לקישור חדש</p>
          </>
        )}
      </div>
    </div>
  )
}
