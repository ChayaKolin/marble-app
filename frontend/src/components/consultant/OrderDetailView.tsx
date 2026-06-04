import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import type { OrderResponse } from '../../api/orders'
import { ORDER_STATUS_HE } from '../../api/orders'

const STATUS_COLOR: Record<string, string> = {
  QUOTATION:                   'bg-slate-700 text-slate-300',
  CLOSED_AWAITING_MEASUREMENT: 'bg-blue-900/60 text-blue-300',
  REVIEWING_LAYOUT:            'bg-amber-900/60 text-amber-300',
  PRODUCTION:                  'bg-purple-900/60 text-purple-300',
  AWAITING_INSTALLATION:       'bg-cyan-900/60 text-cyan-300',
  PENDING_REPAIR:              'bg-red-900/60 text-red-300',
  COMPLETED:                   'bg-emerald-900/60 text-emerald-300',
  ARCHIVED:                    'bg-slate-800 text-slate-500',
}

// What status can be advanced to from current
const NEXT_STATUS: Record<string, { to: string; label: string; requiresConfirm?: string }> = {
  REVIEWING_LAYOUT: {
    to: 'PRODUCTION',
    label: 'העבר לייצור',
    requiresConfirm: 'האם הלקוח חתם על תוכנית הפריסה?',
  },
  PRODUCTION: { to: 'AWAITING_INSTALLATION', label: 'סיים ייצור — מחכה להתקנה' },
  AWAITING_INSTALLATION: { to: 'COMPLETED', label: 'סמן כהושלם', requiresConfirm: 'האם ה-80% שולמו?' },
  COMPLETED: { to: 'ARCHIVED', label: 'ארכב הזמנה' },
}

interface Photo { id: string; fileUrl: string; label: string }
interface Installer { id: string; fullName: string; phoneNumber: string }

interface Props {
  order: OrderResponse
  onBack: () => void
  onUpdated: () => void
}

export default function OrderDetailView({ order, onBack, onUpdated }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [installers, setInstallers] = useState<Installer[]>([])
  const [notes, setNotes] = useState(order.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingMeasurement, setUploadingMeasurement] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [logisticsForm, setLogisticsForm] = useState({ installerId: '', date: '', notes: '' })
  const [savingLogistics, setSavingLogistics] = useState(false)
  const [msg, setMsg] = useState('')
  const photoInput = useRef<HTMLInputElement>(null)
  const measurementInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    axios.get(`/api/v1/orders/${order.id}/photos`)
      .then(r => setPhotos(r.data))
    axios.get('/api/v1/auth/users/installers')
      .then(r => setInstallers(r.data))
  }, [order.id])

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await axios.put(`/api/v1/orders/${order.id}`, { notes })
      setMsg('ההערות נשמרו')
      onUpdated()
    } catch { setMsg('שגיאה בשמירה') }
    finally { setSavingNotes(false); setTimeout(() => setMsg(''), 2500) }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await axios.post(`/api/v1/orders/${order.id}/photos`, fd)
      setPhotos(p => [...p, r.data])
    } finally { setUploadingPhoto(false) }
  }

  async function deletePhoto(photoId: string) {
    await axios.delete(`/api/v1/orders/${order.id}/photos/${photoId}`)
    setPhotos(p => p.filter(x => x.id !== photoId))
  }

  async function uploadMeasurement(file: File) {
    setUploadingMeasurement(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await axios.post(`/api/v1/orders/${order.id}/measurements`, fd)
      setMsg('המדידות הועלו בהצלחה — ההזמנה עברה לשלב "לעבור על התוכנית"')
      onUpdated()
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || 'שגיאה בהעלאה')
    } finally {
      setUploadingMeasurement(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  async function advanceStatus() {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    if (next.requiresConfirm && !confirm(next.requiresConfirm)) return
    setAdvancing(true)
    try {
      await axios.put(`/api/v1/orders/${order.id}/status`, { targetStatus: next.to })
      onUpdated()
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || 'לא ניתן להתקדם — בדוק שהתנאים מולאו')
      setTimeout(() => setMsg(''), 4000)
    } finally { setAdvancing(false) }
  }

  async function assignInstaller() {
    if (!logisticsForm.installerId || !logisticsForm.date) {
      setMsg('בחר מתקין ותאריך')
      return
    }
    setSavingLogistics(true)
    try {
      await axios.post(`/api/v1/orders/${order.id}/logistics`, {
        installerUserId: logisticsForm.installerId,
        deliveryScheduledDate: new Date(logisticsForm.date).toISOString(),
        primary: true,
        installerNotes: logisticsForm.notes || null,
      })
      setMsg('המתקין שובץ — אירוע נוסף ללוח השנה')
      onUpdated()
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || 'שגיאה בשיבוץ')
    } finally {
      setSavingLogistics(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const next = NEXT_STATUS[order.status]

  return (
    <div className="p-4 space-y-5 max-w-2xl" dir="rtl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm">← חזרה</button>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_HE[order.status]}
        </span>
        {next && (
          <button onClick={advanceStatus} disabled={advancing}
            className="mr-auto text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600
                       text-white disabled:opacity-50 transition-colors">
            {advancing ? '...' : next.label} →
          </button>
        )}
      </div>

      {msg && <p className="text-sm text-emerald-300 bg-emerald-900/30 rounded-lg px-3 py-2">{msg}</p>}

      {/* Customer info */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-1">
        <p className="text-slate-100 font-semibold">{order.customerFullName}</p>
        <p className="text-slate-400 text-sm">
          {order.effectiveAddress}, {order.effectiveCity}
          {order.effectiveFloor != null && ` · קומה ${order.effectiveFloor}`}
          {order.effectiveApt && ` · דירה ${order.effectiveApt}`}
        </p>
        <p className="text-emerald-300 text-sm font-medium">
          ₪{Number(order.totalGrossAmount).toLocaleString('he-IL')}
        </p>
      </div>

      {/* Notes */}
      <section className="space-y-2">
        <h3 className="text-slate-300 text-sm font-medium">הערות</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="הוסף הערות להזמנה..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
                     text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                     placeholder:text-slate-600 resize-none"
        />
        <button onClick={saveNotes} disabled={savingNotes}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600
                     text-slate-200 disabled:opacity-50 transition-colors">
          {savingNotes ? 'שומר...' : 'שמור הערות'}
        </button>
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-sm font-medium">תמונות ({photos.length})</h3>
          <button onClick={() => photoInput.current?.click()} disabled={uploadingPhoto}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600
                       text-slate-200 disabled:opacity-50 transition-colors">
            {uploadingPhoto ? 'מעלה...' : '+ הוסף תמונה'}
          </button>
          <input ref={photoInput} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
        </div>

        {photos.length === 0 ? (
          <p className="text-slate-600 text-xs">אין תמונות עדיין</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p.id} className="relative group rounded-lg overflow-hidden bg-slate-800 aspect-square">
                <img src={p.fileUrl} alt={p.label}
                     className="w-full h-full object-cover" />
                <button onClick={() => deletePhoto(p.id)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-700/80
                             text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity
                             flex items-center justify-center">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Measurement upload — only when waiting for measurement */}
      {order.status === 'CLOSED_AWAITING_MEASUREMENT' && (
        <section className="space-y-2 bg-blue-950/30 border border-blue-800/50 rounded-xl p-4">
          <h3 className="text-blue-300 text-sm font-medium">העלאת מדידות</h3>
          <p className="text-slate-400 text-xs">לאחר המדידה, העלה את קובץ המדידות. ההזמנה תעבור אוטומטית לשלב בדיקת התוכנית.</p>
          <button onClick={() => measurementInput.current?.click()} disabled={uploadingMeasurement}
            className="text-sm px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600
                       text-white disabled:opacity-50 transition-colors">
            {uploadingMeasurement ? 'מעלה...' : '📐 העלה קובץ מדידות'}
          </button>
          <input ref={measurementInput} type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg" className="hidden"
            onChange={e => e.target.files?.[0] && uploadMeasurement(e.target.files[0])} />
          {order.measurementsDocumentUrl && (
            <p className="text-xs text-emerald-400">✓ מדידות הועלו
              <a href={order.measurementsDocumentUrl} target="_blank" rel="noreferrer"
                 className="mr-2 underline">צפה</a>
            </p>
          )}
        </section>
      )}

      {/* Installer assignment */}
      {(order.status === 'AWAITING_INSTALLATION' || order.status === 'PENDING_REPAIR') && (
        <section className="space-y-3 bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-4">
          <h3 className="text-cyan-300 text-sm font-medium">שיבוץ מתקין</h3>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs">מתקין</label>
            <select value={logisticsForm.installerId}
              onChange={e => setLogisticsForm(f => ({ ...f, installerId: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">בחר מתקין...</option>
              {installers.map(i => (
                <option key={i.id} value={i.id}>{i.fullName} — {i.phoneNumber}</option>
              ))}
            </select>
            {installers.length === 0 && (
              <p className="text-slate-500 text-xs">אין מתקינים רשומים במערכת עדיין</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-xs">תאריך התקנה</label>
              <input type="datetime-local" value={logisticsForm.date}
                onChange={e => setLogisticsForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                           text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-xs">הערות למתקין</label>
              <input value={logisticsForm.notes}
                onChange={e => setLogisticsForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                           text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="הערות..." />
            </div>
          </div>

          <button onClick={assignInstaller} disabled={savingLogistics}
            className="text-sm px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600
                       text-white disabled:opacity-50 transition-colors">
            {savingLogistics ? 'משבץ...' : '📅 שבץ מתקין ותאריך'}
          </button>
        </section>
      )}
    </div>
  )
}
