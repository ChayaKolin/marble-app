import { useEffect, useState } from 'react'
import {
  type CalendarEventResponse,
  EVENT_TYPE_COLOR,
  deleteCalendarEvent,
  fetchCalendarEvents,
  groupByDate,
} from '../../api/calendar'
import EventDetailPanel from '../shared/EventDetailPanel'

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  // week starts Sunday (0)
  const firstDay = new Date(year, month, 1).getDay()  // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function ConsultantCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [byDate, setByDate] = useState<Record<string, CalendarEventResponse[]>>({})
  const [selected, setSelected] = useState<CalendarEventResponse | null>(null)

  function load() {
    fetchCalendarEvents().then(data => {
      setByDate(groupByDate(data))
    })
  }

  useEffect(() => { load() }, [])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleDelete(id: string) {
    await deleteCalendarEvent(id)
    setSelected(null)
    load()
  }

  const cells = buildMonthGrid(year, month)
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="p-4 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-200 text-lg px-2">›</button>
        <h2 className="text-slate-100 font-semibold text-base flex-1 text-center">
          {MONTHS_HE[month]} {year}
        </h2>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-200 text-lg px-2">‹</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_HE.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const key = toDateKey(year, month, day)
          const dayEvents = byDate[key] ?? []
          const isToday = key === todayKey

          return (
            <div
              key={key}
              className={[
                'min-h-16 rounded-lg p-1.5 border text-right cursor-pointer transition-colors',
                isToday ? 'border-emerald-600 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-600',
              ].join(' ')}
            >
              <span className={`text-xs ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={`w-full text-right text-xs text-white truncate px-1 py-0.5 rounded
                                ${EVENT_TYPE_COLOR[e.eventType]} hover:opacity-90 transition-opacity`}
                  >
                    {e.customerName ?? e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-slate-500">+{dayEvents.length - 3} נוספים</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Side panel */}
      {selected && (
        <EventDetailPanel
          event={selected}
          isConsultant
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </div>
  )
}
