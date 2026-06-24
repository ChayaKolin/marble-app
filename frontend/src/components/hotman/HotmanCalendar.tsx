import { useEffect, useState } from 'react'
import {
  type CalendarEventResponse,
  EVENT_TYPE_COLOR,
  fetchCalendarEvents,
  groupByDate,
} from '../../api/calendar'
import EventDetailPanel from '../shared/EventDetailPanel'

const DAYS_HE       = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAYS_HE_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function HotmanCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [byDate, setByDate] = useState<Record<string, CalendarEventResponse[]>>({})
  const [selected, setSelected] = useState<CalendarEventResponse | null>(null)

  useEffect(() => {
    fetchCalendarEvents().then(data => setByDate(groupByDate(data)))
  }, [])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const cells = buildMonthGrid(year, month)
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="p-4 space-y-4 relative">
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-200 text-lg px-2">›</button>
        <h2 className="text-slate-100 font-semibold text-base flex-1 text-center">
          {MONTHS_HE[month]} {year}
        </h2>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-200 text-lg px-2">‹</button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
        צפייה בלבד — לניהול פנה ליועץ
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS_HE.map((d, i) => (
          <div key={d} className="text-center text-xs text-slate-500 py-1">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DAYS_HE_SHORT[i]}</span>
          </div>
        ))}
      </div>

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
                'min-h-16 rounded-lg p-1.5 border text-right',
                isToday ? 'border-emerald-600 bg-emerald-950/20' : 'border-slate-800',
              ].join(' ')}
            >
              <span className={`text-xs ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>{day}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={`w-full text-right text-xs text-white truncate px-1 py-0.5 rounded
                                ${EVENT_TYPE_COLOR[e.eventType]} hover:opacity-90`}
                  >
                    {e.customerName ?? e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-slate-500">+{dayEvents.length - 3}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <EventDetailPanel
          event={selected}
          isConsultant={false}   // no financial data, no edit controls
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
