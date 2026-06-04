import { useEffect, useState } from 'react'
import { type CalendarEventResponse, EVENT_TYPE_COLOR, fetchCalendarEvents } from '../../api/calendar'

const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function getWeekDates(): Date[] {
  const today = new Date()
  // Find Sunday of current week
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPreviewStrip() {
  const [byDate, setByDate] = useState<Record<string, CalendarEventResponse[]>>({})
  const weekDates = getWeekDates()
  const todayKey = toDateKey(new Date())

  useEffect(() => {
    fetchCalendarEvents().then(events => {
      const grouped: Record<string, CalendarEventResponse[]> = {}
      events.forEach(e => { (grouped[e.eventDate] ??= []).push(e) })
      setByDate(grouped)
    })
  }, [])

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-3">
      <p className="text-slate-500 text-xs mb-2">השבוע הנוכחי</p>
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const key = toDateKey(date)
          const dayEvents = byDate[key] ?? []
          const isToday = key === todayKey

          return (
            <div key={key} className="text-center">
              <p className={`text-xs mb-1 ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                {DAYS_SHORT[i]}
              </p>
              <p className={`text-xs mb-1.5 ${isToday ? 'text-emerald-300' : 'text-slate-400'}`}>
                {date.getDate()}
              </p>
              <div className="flex flex-col gap-0.5 items-center">
                {dayEvents.slice(0, 3).map(e => (
                  <div
                    key={e.id}
                    title={e.customerName ?? e.title}
                    className={`w-2 h-2 rounded-full ${EVENT_TYPE_COLOR[e.eventType]}`}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-slate-600 text-xs">+{dayEvents.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
