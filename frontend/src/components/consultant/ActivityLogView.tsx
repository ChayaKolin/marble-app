import { useEffect, useState } from 'react'
import {
  type ActivityLogEntry,
  ACTIVITY_ACTION_HE,
  fetchActivityLog,
} from '../../api/activityLog'

const ACTION_COLOR: Record<string, string> = {
  ORDER_CREATED: 'bg-emerald-900/60 text-emerald-300',
  ORDER_STATUS_CHANGED: 'bg-blue-900/60 text-blue-300',
  ORDER_DELETED: 'bg-red-900/60 text-red-300',
  ORDER_RESTORED: 'bg-cyan-900/60 text-cyan-300',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ActivityLogView() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivityLog().then(setEntries).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-400 p-6">טוען...</div>

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-100">היסטוריה ופעולות אחרונות</h2>

      {entries.length === 0 ? (
        <p className="text-slate-500 text-sm">אין פעולות להצגה</p>
      ) : (
        <div className="rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
          {entries.map(e => (
            <div key={e.id} className="flex items-start justify-between gap-3 px-3 sm:px-4 py-3 bg-slate-900">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ACTION_COLOR[e.action] ?? 'bg-slate-700 text-slate-300'}`}>
                    {ACTIVITY_ACTION_HE[e.action] ?? e.action}
                  </span>
                  {e.customerName && <span className="text-slate-200 text-sm font-medium truncate">{e.customerName}</span>}
                </div>
                {e.description && <p className="text-slate-400 text-xs">{e.description}</p>}
                {e.reason && (
                  <p className="text-amber-300 text-xs">
                    <span className="text-slate-500">סיבה: </span>{e.reason}
                  </p>
                )}
                <p className="text-slate-600 text-xs">
                  {e.performedByName ?? 'מערכת'} · {formatDateTime(e.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
