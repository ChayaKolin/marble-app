import { type PortalOrderResponse } from '../../api/portal'

interface Props {
  orders: PortalOrderResponse[]
  onSelect: (orderId: string) => void
}

function StatusBadge({ statusHe }: { statusHe: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                     bg-slate-700 text-slate-200">
      {statusHe}
    </span>
  )
}

function MilestonePip({ cleared, label }: { cleared: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cleared ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      <span className={`text-xs ${cleared ? 'text-emerald-300' : 'text-slate-500'}`}>{label}</span>
    </div>
  )
}

export default function PortalOrderList({ orders, onSelect }: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 p-8 text-center">
        <p className="text-slate-500 text-sm">אין הזמנות פעילות כרגע</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <button
          key={order.id}
          onClick={() => onSelect(order.id)}
          className="w-full text-right rounded-xl border border-slate-700 bg-slate-900
                     hover:border-slate-500 hover:bg-slate-800 p-4 transition-colors space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 font-medium text-sm truncate">
                {order.effectiveAddress}, {order.effectiveCity}
                {order.effectiveFloor != null && ` · קומה ${order.effectiveFloor}`}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>
            <StatusBadge statusHe={order.statusHe} />
          </div>

          {/* Payment milestones */}
          {order.paymentMilestones.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {order.paymentMilestones.map(m => (
                <MilestonePip key={m.tier} cleared={m.cleared} label={m.labelHe} />
              ))}
            </div>
          )}

          {/* Action needed indicator */}
          {(order.status === 'REVIEWING_LAYOUT' && !order.layoutApprovalSigned) && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-1.5">
              <p className="text-amber-300 text-xs font-medium">⚠️ נדרשת חתימתך על תוכנית הפריסה</p>
            </div>
          )}
          {(order.status === 'CLOSED_AWAITING_MEASUREMENT' && !order.measurementDisclaimerSigned) && (
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-1.5">
              <p className="text-blue-300 text-xs font-medium">📋 נדרשת אישורך לפני המדידה</p>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
