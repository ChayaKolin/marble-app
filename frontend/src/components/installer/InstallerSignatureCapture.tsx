import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'

interface Props {
  orderId: string
  customerName: string
  onComplete: (captured: boolean) => void  // true = signature captured, false = skipped
}

export default function InstallerSignatureCapture({ orderId, customerName, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCanvas, setShowCanvas] = useState(false)

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(orderId, 'FINAL_POST_INSTALLATION', dataUrl)
      onComplete(true)
    } catch {
      setError('שגיאה בשמירת החתימה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-slate-100 font-semibold text-base">סיום התקנה</h3>
        <p className="text-slate-400 text-sm mt-1">
          חתימת {customerName} לאישור קבלת העבודה
        </p>
      </div>

      {/* Optional badge */}
      <div className="inline-flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-amber-300 text-xs font-medium">אופציונלי — לא חובה</span>
      </div>

      {!showCanvas ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowCanvas(true)}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600
                       text-white font-medium text-sm transition-colors"
          >
            לחץ לחתימת הלקוח
          </button>
          <button
            onClick={() => onComplete(false)}
            className="w-full py-3 rounded-xl border border-slate-700
                       text-slate-400 text-sm hover:bg-slate-800 transition-colors"
          >
            דלג — סיים ללא חתימה
          </button>
        </div>
      ) : (
        <>
          <p className="text-slate-300 text-sm">
            הגש את המכשיר ל-{customerName} לחתימה:
          </p>
          <SignatureCanvas
            onConfirm={handleSign}
            onCancel={() => setShowCanvas(false)}
            disabled={submitting}
            confirmLabel={submitting ? 'שומר...' : 'אשר חתימה וסיים'}
            cancelLabel="ביטול"
          />
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
