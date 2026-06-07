import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'

interface Props {
  orderId: string
  onComplete: () => void
}

export default function PreMeasurementDisclaimer({ orderId, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  async function handleSign(dataUrl: string) {
    setSubmitting(true)
    setError(null)
    try {
      await submitSignature(orderId, 'PRE_MEASUREMENT_DISCLAIMER', dataUrl)
      onComplete()
    } catch {
      setError('שגיאה בשמירת החתימה. אנא נסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-5">
        <h2 className="text-amber-300 font-semibold text-base mb-2">הצהרה לפני מדידה</h2>
        <p className="text-amber-100 text-sm leading-relaxed">
          המחיר הסופי, המידות והפרטים הספציפיים של הפרויקט נקבעים{' '}
          <strong>אך ורק לאחר ביצוע מדידה מקצועית בשטח.</strong>
        </p>
        <p className="text-amber-200 text-xs mt-3">
          בחתימתך אתה/את מאשר/ת שקראת והבנת הצהרה זו.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="accept"
          type="checkbox"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800
                     text-emerald-500 focus:ring-emerald-500 cursor-pointer"
        />
        <label htmlFor="accept" className="text-slate-300 text-sm cursor-pointer select-none">
          קראתי והבנתי את ההצהרה לעיל
        </label>
      </div>

      {accepted && (
        <SignatureCanvas
          onConfirm={handleSign}
          disabled={submitting}
          confirmLabel={submitting ? 'שומר...' : 'אשר וחתום'}
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
