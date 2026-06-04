import { useEffect, useState } from 'react'
import { type CalendarEventResponse, fetchCalendarEvents } from '../../api/calendar'

function todayKey() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function formatTime(time: string | null) {
  if (!time) return null
  return time.slice(0, 5)  // HH:mm
}

export default function InstallerDailyList() {
  const [todayJobs, setTodayJobs] = useState<CalendarEventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const today = todayKey()

  useEffect(() => {
    fetchCalendarEvents()
      .then(events => setTodayJobs(events.filter(e => e.eventDate === today)))
      .finally(() => setLoading(false))
  }, [today])

  if (loading) return <div className="p-4 text-slate-400 text-sm">טוען...</div>

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-slate-100 font-semibold">עבודות היום</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {todayJobs.length === 0 ? (
        <div className="rounded-xl border border-slate-700 p-6 text-center">
          <p className="text-slate-500 text-sm">אין עבודות מתוכננות להיום</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayJobs.map(job => (
            <div
              key={job.id}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3"
            >
              {/* Time */}
              {job.startTime && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <span>🕐</span>
                  <span>{formatTime(job.startTime)}
                    {job.endTime && `–${formatTime(job.endTime)}`}
                  </span>
                </div>
              )}

              {/* Customer */}
              {job.customerName && (
                <div>
                  <p className="text-slate-400 text-xs">לקוח</p>
                  <p className="text-slate-100 font-medium">{job.customerName}</p>
                </div>
              )}

              {/* Address */}
              {job.effectiveAddress && (
                <div>
                  <p className="text-slate-400 text-xs">כתובת</p>
                  <p className="text-slate-200 text-sm">
                    {job.effectiveAddress}, {job.effectiveCity}
                    {job.effectiveFloor != null && ` · קומה ${job.effectiveFloor}`}
                    {job.effectiveApt && ` · דירה ${job.effectiveApt}`}
                  </p>
                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(`${job.effectiveAddress} ${job.effectiveCity}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                  >
                    פתח ב-Waze ↗
                  </a>
                </div>
              )}

              {/* Access notes */}
              {job.elevatorNotes && (
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-2">
                  <p className="text-amber-300 text-xs">{job.elevatorNotes}</p>
                </div>
              )}

              {/* Job notes */}
              {job.notes && (
                <div>
                  <p className="text-slate-400 text-xs">הערות</p>
                  <p className="text-slate-300 text-sm">{job.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
