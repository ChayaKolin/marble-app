import { useEffect, useState } from 'react'
import { type OrderResponse, ORDER_STATUS_HE, fetchActiveOrders } from '../../api/orders'
import AddOrderModal from './AddOrderModal'

const STATUS_COLOR: Record<string, string> = {
  QUOTATION:                   'bg-slate-700 text-slate-300',
  CLOSED_AWAITING_MEASUREMENT: 'bg-blue-900/60 text-blue-300',
  REVIEWING_LAYOUT:            'bg-amber-900/60 text-amber-300',
  PRODUCTION:                  'bg-purple-900/60 text-purple-300',
  AWAITING_INSTALLATION:       'bg-cyan-900/60 text-cyan-300',
  PENDING_REPAIR:              'bg-red-900/60 text-red-300',
  COMPLETED:                   'bg-emerald-900/60 text-emerald-300',
  ARCHIVED:                    'bg-slate-800 text-slate-500',
}

export default function OrderList() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  function load() {
    fetchActiveOrders().then(setOrders).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o =>
    o.customerFullName.includes(search) ||
    o.effectiveAddress.includes(search) ||
    o.effectiveCity.includes(search)
  )

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <h2 className="text-slate-100 font-semibold text-lg flex-1">הזמנות</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600
                     hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          הזמנה חדשה
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="חיפוש לפי שם לקוח, כתובת או עיר..."
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
                   text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                   placeholder:text-slate-500"
      />

      {loading ? (
        <p className="text-slate-400 text-sm">טוען...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-700 p-10 text-center">
          <p className="text-slate-500 text-sm mb-3">
            {search ? 'לא נמצאו הזמנות' : 'אין הזמנות עדיין'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="text-emerald-400 text-sm hover:underline">
              צור הזמנה ראשונה ←
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-2
                         hover:border-slate-500 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-medium">{order.customerFullName}</p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">
                    {order.effectiveAddress}, {order.effectiveCity}
                    {order.effectiveFloor != null && ` · קומה ${order.effectiveFloor}`}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium
                                  ${STATUS_COLOR[order.status] ?? 'bg-slate-700 text-slate-300'}`}>
                  {ORDER_STATUS_HE[order.status]}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>₪{Number(order.totalGrossAmount).toLocaleString('he-IL')}</span>
                <span>·</span>
                <span>{new Date(order.createdAt).toLocaleDateString('he-IL')}</span>
                {order.craneRequired && (
                  <>
                    <span>·</span>
                    <span className="text-amber-500">⚠ נדרש מנוף</span>
                  </>
                )}
              </div>

              {order.notes && (
                <p className="text-slate-500 text-xs border-t border-slate-800 pt-2">{order.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load() }}
        />
      )}
    </div>
  )
}
