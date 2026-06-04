import { useEffect, useState } from 'react'
import { type CustomerResponse, fetchActiveCustomers } from '../../api/customers'
import AddCustomerModal from './AddCustomerModal'
import AddOrderModal from './AddOrderModal'

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addOrderForCustomer, setAddOrderForCustomer] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function load() {
    fetchActiveCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.fullName.includes(search) ||
    c.phoneNumber.includes(search) ||
    c.siteCity.includes(search)
  )

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
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 bg-slate-900 hover:bg-slate-800 transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
                <span className="text-emerald-200 font-bold text-sm">{c.fullName.charAt(0)}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-100 font-medium text-sm">{c.fullName}</p>
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
              {/* Quick order button */}
              <button
                onClick={e => { e.stopPropagation(); setAddOrderForCustomer(c.id) }}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-800/60
                           hover:bg-emerald-700 text-emerald-300 border border-emerald-700/50
                           transition-colors"
              >
                + הזמנה
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load() }}
        />
      )}
      {addOrderForCustomer && (
        <AddOrderModal
          preselectedCustomerId={addOrderForCustomer}
          onClose={() => setAddOrderForCustomer(null)}
          onCreated={() => { setAddOrderForCustomer(null) }}
        />
      )}
    </div>
  )
}
