import { useEffect, useState } from 'react'
import {
  type CustomerResponse,
  fetchDeletedCustomers,
  restoreCustomer,
} from '../../api/customers'
import {
  type OrderResponse,
  ORDER_STATUS_HE,
  fetchDeletedOrders,
  restoreOrder,
} from '../../api/orders'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function TrashView() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchDeletedCustomers(), fetchDeletedOrders()])
      .then(([c, o]) => { setCustomers(c); setOrders(o) })
      .finally(() => setLoading(false))
  }, [])

  async function handleRestoreCustomer(id: string) {
    setRestoring(id)
    try {
      await restoreCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
    } finally {
      setRestoring(null)
    }
  }

  async function handleRestoreOrder(id: string) {
    setRestoring(id)
    try {
      await restoreOrder(id)
      setOrders(prev => prev.filter(o => o.id !== id))
    } finally {
      setRestoring(null)
    }
  }

  if (loading) return <div className="text-slate-400 p-6">טוען...</div>

  const isEmpty = customers.length === 0 && orders.length === 0

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-xl font-semibold text-slate-100">פח האשפה</h2>

      {isEmpty && (
        <p className="text-slate-500 text-sm">אין רשומות מחוקות</p>
      )}

      {/* Deleted customers */}
      {customers.length > 0 && (
        <section>
          <h3 className="text-slate-300 font-medium mb-3">לקוחות מחוקים</h3>
          <div className="rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
            {customers.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{c.fullName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {c.phoneNumber} · נמחק ב-{c.deletedAt ? formatDate(c.deletedAt) : '—'}
                  </p>
                </div>
                <button
                  disabled={restoring === c.id}
                  onClick={() => handleRestoreCustomer(c.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                             text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                  שחזור
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deleted orders */}
      {orders.length > 0 && (
        <section>
          <h3 className="text-slate-300 font-medium mb-3">הזמנות מחוקות</h3>
          <div className="rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{o.customerFullName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {ORDER_STATUS_HE[o.status]} · {o.effectiveAddress}, {o.effectiveCity}
                    · נמחק ב-{o.deletedAt ? formatDate(o.deletedAt) : '—'}
                  </p>
                </div>
                <button
                  disabled={restoring === o.id}
                  onClick={() => handleRestoreOrder(o.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                             text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                  שחזור
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
