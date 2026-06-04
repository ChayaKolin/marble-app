import { useEffect, useState } from 'react'
import { type PortalOrderResponse, fetchPortalOrder, fetchPortalOrders } from '../../api/portal'
import PortalOrderList from './PortalOrderList'
import PortalOrderDetail from './PortalOrderDetail'

export default function CustomerPortalShell() {
  const [orders, setOrders] = useState<PortalOrderResponse[]>([])
  const [selected, setSelected] = useState<PortalOrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetchPortalOrders()
      .then(setOrders)
      .catch(() => setError('שגיאה בטעינת ההזמנות'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSelectOrder(orderId: string) {
    const order = await fetchPortalOrder(orderId)
    setSelected(order)
  }

  async function handleActionComplete() {
    if (selected) {
      // Refresh the selected order to reflect new signature status
      const refreshed = await fetchPortalOrder(selected.id)
      setSelected(refreshed)
      load()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-200 text-sm"
            >
              ← חזרה
            </button>
          )}
          <h1 className="text-slate-100 font-semibold">פורטל לקוח</h1>
          <span className="text-xs text-slate-500 mr-auto">Kostone Marble</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading && <p className="text-slate-400 text-sm text-center">טוען...</p>}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {!loading && !error && !selected && (
          <>
            <h2 className="text-slate-300 text-sm mb-4">ההזמנות שלי</h2>
            <PortalOrderList orders={orders} onSelect={handleSelectOrder} />
          </>
        )}

        {selected && (
          <PortalOrderDetail
            order={selected}
            onActionComplete={handleActionComplete}
          />
        )}
      </main>
    </div>
  )
}
