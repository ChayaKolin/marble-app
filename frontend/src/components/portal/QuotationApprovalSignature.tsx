import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'
import { CRANE_DISCLAIMER_HE } from '../../lib/constants'
import { type PortalOrderResponse } from '../../api/portal'

interface Props {
  order: PortalOrderResponse
  onComplete: () => void
}

export default function QuotationApprovalSignature({ order, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState(false)

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(order.id, 'QUOTATION_APPROVAL', dataUrl)
      onComplete()
    } catch {
      setError('שגיאה בשמירת החתימה. אנא נסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-100 font-semibold text-lg mb-1">אישור הצעת מחיר מפורטת</h2>
        <p className="text-slate-400 text-sm">
          עיין/י בפרטי ההזמנה ואשר/י בחתימה כי זהו ההזמנה שביקשת
        </p>
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-4">
        {/* Address */}
        <div>
          <p className="text-slate-500 text-xs mb-1">כתובת האתר</p>
          <p className="text-slate-200 text-sm">
            {order.effectiveAddress}, {order.effectiveCity}
            {order.effectiveFloor != null && ` · קומה ${order.effectiveFloor}`}
            {order.effectiveApt && ` · דירה ${order.effectiveApt}`}
          </p>
        </div>

        {/* Marble/stone specs */}
        <div>
          <p className="text-slate-500 text-xs mb-1">מפרט שיש ואבן</p>
          {order.materialSpecs.length === 0 ? (
            <p className="text-slate-500 text-xs">לא הוזן מפרט שיש/אבן</p>
          ) : (
            <div className="space-y-1.5">
              {order.materialSpecs.map((s, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm">
                  <p className="text-slate-100">{s.marbleModelCode} <span className="text-slate-400">· {s.finishType}</span></p>
                  <p className="text-slate-400 text-xs">
                    {Number(s.squareMeters)} מ"ר
                    {s.counterEdgeDetailing && ` · קאנט: ${s.counterEdgeDetailing}`}
                    {s.waterEdgeRequired && ' · מגבה למים'}
                    {Number(s.cooktopBaseFee) > 0 && ` · עלות כיריים: ₪${Number(s.cooktopBaseFee).toLocaleString('he-IL')}`}
                  </p>
                  {s.notes && <p className="text-slate-500 text-xs">הערה: {s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sinks */}
        {order.sinkSpecs.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs mb-1">כיורים</p>
            <div className="space-y-1.5">
              {order.sinkSpecs.map((s, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm">
                  <p className="text-slate-100">
                    {s.brand} <span className="text-slate-400">· {s.modelName}</span>
                    {s.quantity > 1 && <span className="text-emerald-400"> × {s.quantity}</span>}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {s.widthMm}×{s.heightMm}×{s.depthMm} מ"מ · {s.color} · {s.mountingStyle === 'UNDERMOUNT' ? 'הטמנה מתחת' : 'הטמנה שטוחה'}
                  </p>
                  {s.notes && <p className="text-slate-500 text-xs">הערה: {s.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total + payment breakdown */}
        <div>
          <p className="text-slate-500 text-xs mb-1">סכום ותשלומים</p>
          {order.totalGrossAmount == null ? (
            <p className="text-slate-500 text-xs">סכום כולל לא נקבע עדיין</p>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">סכום כולל</span>
                <span className="text-emerald-300 font-semibold">₪{Number(order.totalGrossAmount).toLocaleString('he-IL')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">מקדמה (20%)</span>
                <span className="text-slate-300">₪{(Number(order.totalGrossAmount) * 0.2).toLocaleString('he-IL')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">יתרה (80%)</span>
                <span className="text-slate-300">₪{(Number(order.totalGrossAmount) * 0.8).toLocaleString('he-IL')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Crane disclaimer */}
        {order.craneRequired && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-3 py-2">
            <p className="text-amber-300 text-xs">{CRANE_DISCLAIMER_HE}</p>
          </div>
        )}
      </div>

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="reviewed"
          type="checkbox"
          checked={reviewed}
          onChange={e => setReviewed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800
                     text-emerald-500 focus:ring-emerald-500 cursor-pointer"
        />
        <label
          htmlFor="reviewed"
          className="text-slate-300 text-sm cursor-pointer select-none"
        >
          קראתי ואני מאשר/ת את פרטי ההזמנה כמפורט לעיל
        </label>
      </div>

      {/* Signature capture — only shown after reviewing */}
      {reviewed && (
        <SignatureCanvas
          onConfirm={handleSign}
          disabled={submitting}
          confirmLabel={submitting ? 'שולח...' : 'אשר וחתום על ההצעה'}
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
