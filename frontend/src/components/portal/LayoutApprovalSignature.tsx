import { useState } from 'react'
import SignatureCanvas from '../shared/SignatureCanvas'
import { submitSignature } from '../../api/signatures'

interface Props {
  orderId: string
  layoutDocumentUrl?: string  // URL to the uploaded layout PDF
  onComplete: () => void
}

export default function LayoutApprovalSignature({ orderId, layoutDocumentUrl, onComplete }: Props) {
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
