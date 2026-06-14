import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'
import type { PortalMaterialSpec, PortalSinkSpec } from '../../api/portal'

interface Props {
  orderId: string
  layoutDocumentUrl?: string  // URL to the uploaded layout PDF
  materialSpecs: PortalMaterialSpec[]
  sinkSpecs: PortalSinkSpec[]
  onComplete: () => void
}

export default function LayoutApprovalSignature({ orderId, layoutDocumentUrl, materialSpecs, sinkSpecs, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState(false)

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(orderId, 'SLAB_LAYOUT_APPROVAL', dataUrl)
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
        <h2 className="text-slate-100 font-semibold text-lg mb-1">אישור תוכנית פריסה</h2>
        <p className="text-slate-400 text-sm">
          עיין/י בתוכנית הפריסה ואשר/י בחתימה לפני תחילת הייצור
        </p>
      </div>

      {/* Order specification — for review before signing */}
      {(materialSpecs.length > 0 || sinkSpecs.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <p className="text-slate-300 text-sm font-medium">המפרט שלך</p>

          {materialSpecs.map((s, i) => (
            <div key={`mat-${i}`} className="space-y-1 pb-2 border-b border-slate-800 last:border-0 last:pb-0">
              <p className="text-slate-100 text-sm font-medium">
                {s.marbleModelCode} <span className="text-slate-400 font-normal">· {s.finishType}</span>
              </p>
              <p className="text-emerald-300 text-sm">{s.squareMeters} מ"ר</p>
              {s.counterEdgeDetailing && <p className="text-slate-400 text-xs">קאנט: {s.counterEdgeDetailing}</p>}
              <div className="flex gap-3 text-xs">
                {s.waterEdgeRequired && <span className="text-amber-400">קאנט מים ✓</span>}
                {s.cooktopBaseFee > 0 && <span className="text-slate-500">כיריים: ₪{s.cooktopBaseFee}</span>}
              </div>
              {s.notes && <p className="text-slate-400 text-xs">הערה: {s.notes}</p>}
            </div>
          ))}

          {sinkSpecs.map((s, i) => (
            <div key={`sink-${i}`} className="space-y-1 pb-2 border-b border-slate-800 last:border-0 last:pb-0">
              <p className="text-slate-100 text-sm font-medium">
                {s.brand} <span className="text-slate-400 font-normal">· {s.modelName}</span>
                {s.quantity > 1 && <span className="text-emerald-400"> × {s.quantity}</span>}
              </p>
              <p className="text-slate-400 text-xs">{s.widthMm}×{s.heightMm}×{s.depthMm} מ"מ · {s.color}</p>
              <p className="text-slate-500 text-xs">{s.mountingStyle === 'UNDERMOUNT' ? 'הטמנה מתחת' : 'הטמנה שטוחה'}</p>
              {s.notes && <p className="text-slate-400 text-xs">הערה: {s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Layout document preview */}
      {layoutDocumentUrl ? (
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-slate-300 text-sm font-medium">תוכנית הפריסה שלך</span>
            <a
              href={layoutDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 text-xs hover:underline"
            >
              פתח בחלון חדש ↗
            </a>
          </div>
          <iframe
            src={layoutDocumentUrl}
            className="w-full h-64"
            title="תוכנית פריסה"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center">
          <p className="text-slate-500 text-sm">התוכנית בהכנה — תקבל/י עדכון כשתהיה מוכנה</p>
        </div>
      )}

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="reviewed"
          type="checkbox"
          checked={reviewed}
          onChange={e => setReviewed(e.target.checked)}
          disabled={!layoutDocumentUrl}
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800
                     text-emerald-500 focus:ring-emerald-500 cursor-pointer
                     disabled:cursor-not-allowed"
        />
        <label
          htmlFor="reviewed"
          className="text-slate-300 text-sm cursor-pointer select-none"
        >
          עיינתי בתוכנית הפריסה ואני מאשר/ת להמשיך לייצור
        </label>
      </div>

      {/* Signature capture — only shown after reviewing */}
      {reviewed && layoutDocumentUrl && (
        <>
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
            <p className="text-red-300 text-xs font-medium">
              ⚠️ לאחר אישורך, הייצור יחל ולא ניתן לבצע שינויים בתוכנית
            </p>
          </div>

          <SignatureCanvas
            onConfirm={handleSign}
            disabled={submitting}
            confirmLabel={submitting ? 'שולח...' : 'אשר וחתום — התחל ייצור'}
          />
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
