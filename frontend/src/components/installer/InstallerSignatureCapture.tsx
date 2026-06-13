import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'
import { markLogisticsComplete } from '../../api/logistics'

interface Props {
  orderId: string
  assignmentId: string
  customerName: string
  onComplete: () => void
}

export default function InstallerSignatureCapture({ orderId, assignmentId, customerName, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [notes, setNotes] = useState('')

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(orderId, 'FINAL_POST_INSTALLATION', dataUrl, notes || undefined)
      await markLogisticsComplete(orderId, assignmentId)
      onComplete()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'שגיאה בשמירת החתימה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-slate-100 font-semibold text-base">סיום התקנה</h3>
        <p className="text-slate-400 text-sm mt-1">
          חתימת {customerName} לאישור שההתקנה הושלמה במלואה
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-red-300 text-xs font-medium">חובה — נדרש לפני קבלת יתרת התשלום</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-slate-400 text-xs">הערות (אופציונלי)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="הערות לגבי ההתקנה..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm
                     focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
        />
      </div>

      {!showCanvas ? (
        <button
          onClick={() => setShowCanvas(true)}
          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600
                     text-white font-medium text-sm transition-colors"
        >
          לחץ לחתימת הלקוח
        </button>
      ) : (
        <>
          <p className="text-slate-300 text-sm">
            הגש את המכשיר ל-{customerName} לחתימה:
          </p>
          <SignatureCanvas
            onConfirm={handleSign}
            onCancel={() => setShowCanvas(false)}
            disabled={submitting}
            confirmLabel={submitting ? 'שומר...' : 'אשר חתימה וסיים עבודה'}
            cancelLabel="ביטול"
          />
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
