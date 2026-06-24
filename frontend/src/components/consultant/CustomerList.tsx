import { useEffect, useState } from 'react'
import axios from 'axios'
import { type CustomerResponse, fetchActiveCustomers } from '../../api/customers'
import { type OrderResponse, fetchOrderById } from '../../api/orders'
import AddCustomerModal from './AddCustomerModal'
import AddOrderModal from './AddOrderModal'
import OrderDetailView from './OrderDetailView'

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addOrderForCustomer, setAddOrderForCustomer] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeOrder, setActiveOrder] = useState<OrderResponse | null>(null)

  function load() {
    fetchActiveCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false))
  }

  function openActiveOrder(orderId: string) {
    fetchOrderById(orderId).then(setActiveOrder)
  }

  function handleOrderUpdated() {
    if (!activeOrder) return
    fetchOrderById(activeOrder.id).then(setActiveOrder)
    load()
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.fullName.includes(search) ||
    c.phoneNumber.includes(search) ||
    c.siteCity.includes(search)
  )

  if (activeOrder) {
    return (
      <OrderDetailView
        order={activeOrder}
        onBack={() => { setActiveOrder(null); load() }}
        onUpdated={handleOrderUpdated}
      />
    )
  }

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <h2 className="text-slate-100 font-semibold text-lg flex-1">לקוחות</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600
                     hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          הוסף לקוח
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="חיפוש לפי שם, טלפון או עיר..."
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
                   text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                   placeholder:text-slate-500"
      />

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">טוען...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-700 p-10 text-center">
          <p className="text-slate-500 text-sm mb-3">
            {search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-emerald-400 text-sm hover:underline"
            >
              הוסף לקוח ראשון ←
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-slate-900 hover:bg-slate-800 transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
                <span className="text-emerald-200 font-bold text-sm">{c.fullName.charAt(0)}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-100 font-medium text-sm truncate">{c.fullName}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">
                  {c.phoneNumber} · {c.siteAddress}, {c.siteCity}
                  {c.siteFloor != null && ` · קומה ${c.siteFloor}`}
                </p>
              </div>

              {/* Architect badge */}
              {c.architectName && (
                <span className="text-xs text-slate-500 shrink-0 hidden sm:block">
                  אדריכל: {c.architectName}
                </span>
              )}
              {/* Quick order / active order button */}
              {c.activeOrderId ? (
                <button
                  onClick={e => { e.stopPropagation(); openActiveOrder(c.activeOrderId!) }}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-amber-800/60
                             hover:bg-amber-700 text-amber-300 border border-amber-700/50
                             transition-colors"
                >
                  הזמנה פעילה
                </button>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setAddOrderForCustomer(c.id) }}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-800/60
                             hover:bg-emerald-700 text-emerald-300 border border-emerald-700/50
                             transition-colors"
                >
                  + הזמנה
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={async (customer) => {
            setShowAdd(false)
            load()
            // Skip the "new order" form entirely — auto-create a minimal order for the
            // customer just added (everything else can be filled in later from the order's
            // own page, same as the "amount known only after measurement" flow) and land
            // straight on its detail view
            try {
              const { data } = await axios.post<OrderResponse>('/api/v1/orders', { customerId: customer.id })
              setActiveOrder(data)
            } catch {
              // Fall back to the manual "new order" form so she can still create one
              // for this customer if the automatic creation failed
              setAddOrderForCustomer(customer.id)
            }
          }}
        />
      )}
      {addOrderForCustomer && (
        <AddOrderModal
          preselectedCustomerId={addOrderForCustomer}
          onClose={() => setAddOrderForCustomer(null)}
          onCreated={(order) => {
            setAddOrderForCustomer(null)
            load()
            // Land straight on the new order's detail page with its details, instead of back on the list
            setActiveOrder(order)
          }}
        />
      )}
    </div>
  )
}
