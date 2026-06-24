import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'
import type { PortalMaterialSpec, PortalSinkSpec } from '../../api/portal'

interface Props {
  orderId: string
  materialSpecs: PortalMaterialSpec[]
  sinkSpecs: PortalSinkSpec[]
  onComplete: () => void
}

export default function FinalInstallationSignature({ orderId, materialSpecs, sinkSpecs, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(orderId, 'FINAL_POST_INSTALLATION', dataUrl)
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
        <h2 className="text-slate-100 font-semibold text-lg mb-1">אישור קבלת העבודה</h2>
        <p className="text-slate-400 text-sm">
          ההתקנה הושלמה. אנא עברי על הפרטים למטה, ודאי שהכל תקין, ואשרי בחתימה.
        </p>
      </div>

      {/* Spec summary for customer to verify */}
      {(materialSpecs.length > 0 || sinkSpecs.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <p className="text-slate-300 text-sm font-medium">פרטי ההתקנה</p>

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

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="confirmed"
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800
                     text-emerald-500 focus:ring-emerald-500 cursor-pointer"
        />
        <label
          htmlFor="confirmed"
          className="text-slate-300 text-sm cursor-pointer select-none"
        >
          כל הפריטים הותקנו כמפורט ואני מאשר/ת שהעבודה בוצעה כראוי
        </label>
      </div>

      {/* Signature canvas — shown only after confirming */}
      {confirmed && (
        <>
          <div className="rounded-xl border border-amber-700/60 bg-amber-950/30 p-4 space-y-2">
            <p className="text-amber-300 text-sm font-semibold">לתשומת לבך לפני החתימה</p>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              בחתימתך אתה/את מאשר/ת כי עברת על כל הפריטים בעת נוכחות המתקין וכי כל דבר תקין.
            </p>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              תקלות או ליקויים שלא הועלו בשעת ההתקנה עצמה לא יתקבלו במסגרת השירות הכלול.
              ביקור טכנאי לאחר מכן כרוך ב־<span className="font-semibold text-amber-300">דמי ביקור של ₪600</span>.
            </p>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4">
            <p className="text-emerald-300 text-xs font-medium">
              חתימתך מאשרת את קבלת העבודה, סיום ההתקנה בהצלחה, והסכמתך לתנאים לעיל
            </p>
          </div>

          <SignatureCanvas
            onConfirm={handleSign}
            disabled={submitting}
            confirmLabel={submitting ? 'שולח...' : 'חתום ואשר סיום התקנה'}
          />
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
