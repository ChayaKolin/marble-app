import { useState } from 'react'
import { type PortalOrderResponse } from '../../api/portal'
import { ORDER_STATUS_HE } from '../../api/orders'
import PreMeasurementDisclaimer from './PreMeasurementDisclaimer'
import LayoutApprovalSignature from './LayoutApprovalSignature'

type ActiveScreen = 'detail' | 'disclaimer' | 'layout'

interface Props {
  order: PortalOrderResponse
  onActionComplete: () => void
}

export default function PortalOrderDetail({ order, onActionComplete }: Props) {
  const [screen, setScreen] = useState<ActiveScreen>('detail')

  if (screen === 'disclaimer') {
    return (
      <PreMeasurementDisclaimer
        orderId={order.id}
        onComplete={() => { setScreen('detail'); onActionComplete() }}
      />
    )
  }

  if (screen === 'layout') {
    return (
      <LayoutApprovalSignature
        orderId={order.id}
        layoutDocumentUrl={order.layoutDocumentUrl ?? undefined}
        materialSpecs={order.materialSpecs}
        sinkSpecs={order.sinkSpecs}
        onComplete={() => { setScreen('detail'); onActionComplete() }}
      />
    )
  }

  // Main detail view
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">סטטוס</span>
          <span className="text-slate-100 font-medium text-sm">
            {ORDER_STATUS_HE[order.status]}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-400 text-xs shrink-0">כתובת</span>
          <span className="text-slate-200 text-sm">
            {order.effectiveAddress}, {order.effectiveCity}
            {order.effectiveFloor != null && ` · קומה ${order.effectiveFloor}`}
            {order.effectiveApt && ` · דירה ${order.effectiveApt}`}
          </span>
        </div>
      </div>

      {/* Payment milestones */}
      {order.paymentMilestones.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <p className="text-slate-400 text-xs font-medium">תשלומים</p>
          {order.paymentMilestones.map(m => (
            <div key={m.tier} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${m.cleared ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-slate-300 text-sm">{m.labelHe}</span>
              </div>
              <div className="text-left">
                <span className={`text-sm font-medium ${m.cleared ? 'text-emerald-300' : 'text-slate-400'}`}>
                  ₪{m.amount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs mr-2 ${m.cleared ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {m.cleared ? '✓ שולם' : 'טרם שולם'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Pre-measurement disclaimer */}
        {order.status === 'CLOSED_AWAITING_MEASUREMENT' && (
          <div className={`rounded-xl border p-4 space-y-3 ${
            order.measurementDisclaimerSigned
              ? 'border-emerald-800 bg-emerald-950/20'
              : 'border-amber-700 bg-amber-950/20'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">אישור לפני מדידה</p>
              {order.measurementDisclaimerSigned
                ? <span className="text-emerald-400 text-xs">✓ נחתם</span>
                : <span className="text-amber-400 text-xs">נדרשת חתימה</span>
              }
            </div>
            {!order.measurementDisclaimerSigned && (
              <button
                onClick={() => setScreen('disclaimer')}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500
                           text-white text-sm font-medium transition-colors"
              >
                חתום על אישור המדידה
              </button>
            )}
          </div>
        )}

        {/* Layout approval */}
        {order.status === 'REVIEWING_LAYOUT' && (
          <div className={`rounded-xl border p-4 space-y-3 ${
            order.layoutApprovalSigned
              ? 'border-emerald-800 bg-emerald-950/20'
              : 'border-red-800 bg-red-950/20'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">אישור תוכנית פריסה</p>
              {order.layoutApprovalSigned
                ? <span className="text-emerald-400 text-xs">✓ נחתם — הייצור יחל בקרוב</span>
                : <span className="text-red-400 text-xs">נדרשת חתימה לפני ייצור</span>
              }
            </div>
            {!order.layoutApprovalSigned && (
              <>
                {order.layoutDocumentUrl ? (
                  <button
                    onClick={() => setScreen('layout')}
                    className="w-full py-2.5 rounded-lg bg-red-700 hover:bg-red-600
                               text-white text-sm font-medium transition-colors"
                  >
                    צפה בתוכנית וחתום לאישור
                  </button>
                ) : (
                  <p className="text-slate-500 text-xs">התוכנית בהכנה — תקבל/י הודעה כשתהיה מוכנה</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
