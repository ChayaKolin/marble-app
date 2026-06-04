import { useEffect, useRef, useState } from 'react'
import { fetchProductionOrders, hoursUntilDeadline, slaUrgency, type SlaUrgency } from '../../api/sla'
import type { OrderResponse } from '../../api/orders'

const URGENCY_STYLES: Record<SlaUrgency, { border: string; badge: string; label: string }> = {
  green:  { border: 'border-emerald-700', badge: 'bg-emerald-900/40 text-emerald-300', label: 'בזמן' },
  yellow: { border: 'border-amber-600',   badge: 'bg-amber-900/40 text-amber-300',     label: 'קרוב לסיום' },
  red:    { border: 'border-red-600',     badge: 'bg-red-900/40 text-red-300',          label: 'דחוף' },
}

function SlaCard({ order }: { order: OrderResponse }) {
  const hours = hoursUntilDeadline(order.factorySlaDeadline ?? null)
  const urgency = slaUrgency(hours)
  const styles = URGENCY_STYLES[urgency]

  const displayTime =
    hours === null ? '—' :
    hours < 0 ? `${Math.abs(hours)} שעות באיחור` :
    hours < 24 ? `${hours} שעות` :
    `${Math.floor(hours / 24)} ימים`

  return (
    <div className={`rounded-xl border-2 ${styles.border} bg-slate-900 p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-slate-100 font-medium text-sm">{order.customerFullName}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {order.effectiveAddress}, {order.effectiveCity}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${urgency === 'red' ? 'bg-red-400 animate-pulse' : urgency === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <span className="text-slate-300 text-sm font-mono">{displayTime}</span>
        <span className="text-slate-600 text-xs">נותרו</span>
      </div>

      {order.factorySlaDeadline && (
        <p className="text-slate-600 text-xs">
          מועד סיום:{' '}
          {new Date(order.factorySlaDeadline).toLocaleDateString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

export default function SlaAlertDeck() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function load() {
    fetchProductionOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Refresh every 5 minutes to keep timers fresh
    intervalRef.current = setInterval(load, 5 * 60 * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  if (loading) return <div className="text-slate-400 text-sm p-4">טוען...</div>

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold">לוח SLA — הזמנות בייצור</h2>
        <span className="text-slate-500 text-xs">{orders.length} פעילות</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-slate-600 text-sm">אין הזמנות בשלב ייצור כרגע</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map(o => <SlaCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  )
}
