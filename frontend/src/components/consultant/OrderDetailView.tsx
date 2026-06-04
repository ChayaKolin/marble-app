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

const NEXT_STATUS: Record<string, { to: string; label: string; requiresConfirm?: string }> = {
  QUOTATION:                   { to: 'CLOSED_AWAITING_MEASUREMENT', label: 'סגור עסקה — ממתין למדידה', requiresConfirm: 'האם המקדמה של 20% שולמה?' },
  CLOSED_AWAITING_MEASUREMENT: { to: 'REVIEWING_LAYOUT', label: 'מדידות הועלו — לעבור תוכנית' },
  REVIEWING_LAYOUT:            { to: 'PRODUCTION', label: 'לקוח אישר — התחל ייצור', requiresConfirm: 'האם הלקוח חתם על תוכנית הפריסה?' },
  PRODUCTION:                  { to: 'AWAITING_INSTALLATION', label: 'ייצור הסתיים — ממתין להתקנה' },
  AWAITING_INSTALLATION:       { to: 'COMPLETED', label: 'סמן כהושלם', requiresConfirm: 'האם יתרת ה-80% שולמה?' },
  COMPLETED:                   { to: 'ARCHIVED', label: 'ארכב הזמנה' },
}

const FINISH_TYPES = ['מבריק', 'מלוטש', 'מט', 'חלק', 'מוברש']

interface Photo  { id: string; fileUrl: string; label: string }
interface MatSpec { id: string; marbleModelCode: string; finishType: string; squareMeters: number; counterEdgeDetailing: string; waterEdgeRequired: boolean; cooktopBaseFee: number }
interface Installer { id: string; fullName: string; phoneNumber: string }

type Tab = 'info' | 'specs' | 'photos' | 'logistics'

interface Props { order: OrderResponse; onBack: () => void; onUpdated: (fresh?: OrderResponse) => void }

export default function OrderDetailView({ order, onBack, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const [photos, setPhotos]     = useState<Photo[]>([])
  const [specs, setSpecs]       = useState<MatSpec[]>([])
  const [installers, setInstallers] = useState<Installer[]>([])
  const [notes, setNotes]       = useState(order.notes ?? '')
  const [msg, setMsg]           = useState('')
  const [busy, setBusy]         = useState('')

  // Material spec form
  const [specForm, setSpecForm] = useState({ marbleModelCode:'', finishType:'מבריק', squareMeters:'', counterEdgeDetailing:'', waterEdgeRequired:false, cooktopBaseFee:'200' })

  // Logistics form
  const [logForm, setLogForm]   = useState({ installerId:'', date:'', notes:'' })

  const photoRef       = useRef<HTMLInputElement>(null)
  const measureRef     = useRef<HTMLInputElement>(null)

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  useEffect(() => {
    axios.get(`/api/v1/orders/${order.id}/photos`).then(r => setPhotos(r.data))
    axios.get(`/api/v1/orders/${order.id}/materials`).then(r => setSpecs(r.data))
    axios.get('/api/v1/auth/users/installers').then(r => setInstallers(r.data))
  }, [order.id])

  async function saveNotes() {
    setBusy('notes')
    try { await axios.put(`/api/v1/orders/${order.id}`, { notes }); flash('הערות נשמרו'); onUpdated() }
    catch { flash('שגיאה') } finally { setBusy('') }
  }

  async function uploadPhoto(file: File) {
    setBusy('photo')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r  = await axios.post(`/api/v1/orders/${order.id}/photos`, fd)
      setPhotos(p => [...p, r.data])
    } catch { flash('שגיאה בהעלאת תמונה') } finally { setBusy('') }
  }

  async function deletePhoto(id: string) {
    await axios.delete(`/api/v1/orders/${order.id}/photos/${id}`)
    setPhotos(p => p.filter(x => x.id !== id))
  }

  async function uploadMeasurement(file: File) {
    setBusy('measure')
    try {
      const fd = new FormData(); fd.append('file', file)
      await axios.post(`/api/v1/orders/${order.id}/measurements`, fd)
      flash('מדידות הועלו — ההזמנה עברה לשלב תוכנית')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה') }
    finally { setBusy('') }
  }

  async function advance() {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    if (next.requiresConfirm && !confirm(next.requiresConfirm)) return
    setBusy('advance')
    try {
      await axios.put(`/api/v1/orders/${order.id}/status`, { targetStatus: next.to })
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'לא ניתן להתקדם') }
    finally { setBusy('') }
  }

  async function addSpec() {
    if (!specForm.marbleModelCode || !specForm.squareMeters) { flash('מלא סוג שיש ומ"ר'); return }
    setBusy('spec')
    try {
      const r = await axios.post(`/api/v1/orders/${order.id}/materials`, {
        ...specForm,
        squareMeters: parseFloat(specForm.squareMeters),
        cooktopBaseFee: parseFloat(specForm.cooktopBaseFee || '200'),
      })
      setSpecs(s => [...s, { ...specForm, id: r.data.id, squareMeters: parseFloat(specForm.squareMeters), cooktopBaseFee: parseFloat(specForm.cooktopBaseFee || '200'), waterEdgeRequired: specForm.waterEdgeRequired }])
      setSpecForm({ marbleModelCode:'', finishType:'מבריק', squareMeters:'', counterEdgeDetailing:'', waterEdgeRequired:false, cooktopBaseFee:'200' })
      flash('מפרט נוסף')
    } catch { flash('שגיאה') } finally { setBusy('') }
  }

  async function deleteSpec(id: string) {
    await axios.delete(`/api/v1/orders/${order.id}/materials/${id}`)
    setSpecs(s => s.filter(x => x.id !== id))
  }

  async function assignInstaller() {
    if (!logForm.installerId || !logForm.date) { flash('בחר מתקין ותאריך'); return }
    setBusy('logistics')
    try {
      await axios.post(`/api/v1/orders/${order.id}/logistics`, {
        installerUserId: logForm.installerId,
        deliveryScheduledDate: new Date(logForm.date).toISOString(),
        primary: true,
        installerNotes: logForm.notes || null,
      })
      flash('המתקין שובץ — אירוע נוסף ללוח השנה')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה') }
    finally { setBusy('') }
  }

  const next = NEXT_STATUS[order.status]
  const TABS: { id: Tab; label: string }[] = [
    { id: 'info', label: 'פרטים' },
    { id: 'specs', label: `מפרט שיש ${specs.length > 0 ? `(${specs.length})` : ''}` },
    { id: 'photos', label: `תמונות ${photos.length > 0 ? `(${photos.length})` : ''}` },
    { id: 'logistics', label: 'לוגיסטיקה' },
  ]

  return (
    <div className="p-4 space-y-4 max-w-2xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm shrink-0">← חזרה</button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 font-semibold truncate">{order.customerFullName}</p>
          <p className="text-slate-500 text-xs truncate">{order.effectiveAddress}, {order.effectiveCity}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_HE[order.status]}
        </span>
      </div>

      {/* Advance button */}
      {next && (
        <button onClick={advance} disabled={busy === 'advance'}
          className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600
                     text-white text-sm font-medium disabled:opacity-50 transition-colors">
          {busy === 'advance' ? '...' : `${next.label} →`}
        </button>
      )}

      {msg && <p className="text-sm text-emerald-300 bg-emerald-900/30 rounded-lg px-3 py-2">{msg}</p>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm transition-colors ${
              tab === t.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ─────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs">סכום כולל</p>
              <p className="text-emerald-300 font-semibold">₪{Number(order.totalGrossAmount).toLocaleString('he-IL')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">תאריך פתיחה</p>
              <p className="text-slate-200">{new Date(order.createdAt).toLocaleDateString('he-IL')}</p>
            </div>
            {order.effectiveFloor != null && (
              <div>
                <p className="text-slate-500 text-xs">קומה</p>
                <p className="text-slate-200">{order.effectiveFloor}{order.effectiveApt ? ` · דירה ${order.effectiveApt}` : ''}</p>
              </div>
            )}
            {order.craneRequired && (
              <div className="col-span-2">
                <p className="text-amber-400 text-xs">⚠ נדרש מנוף — על חשבון הלקוח</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="הוסף הערות..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                         placeholder:text-slate-600 resize-none" />
            <button onClick={saveNotes} disabled={busy === 'notes'}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600
                         text-slate-200 disabled:opacity-50 transition-colors">
              {busy === 'notes' ? 'שומר...' : 'שמור הערות'}
            </button>
          </div>

          {/* Measurement upload */}
          {order.status === 'CLOSED_AWAITING_MEASUREMENT' && (
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 space-y-2">
              <p className="text-blue-300 text-sm font-medium">📐 העלאת מדידות</p>
              <p className="text-slate-400 text-xs">לאחר שהמודד סיים, העלה את קובץ המדידות. ההזמנה תעבור אוטומטית לשלב הבא.</p>
              <button onClick={() => measureRef.current?.click()} disabled={busy === 'measure'}
                className="text-sm px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600
                           text-white disabled:opacity-50 transition-colors">
                {busy === 'measure' ? 'מעלה...' : 'העלה קובץ מדידות'}
              </button>
              <input ref={measureRef} type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg" className="hidden"
                onChange={e => e.target.files?.[0] && uploadMeasurement(e.target.files[0])} />
              {order.measurementsDocumentUrl && (
                <p className="text-emerald-400 text-xs">✓ מדידות הועלו <a href={order.measurementsDocumentUrl} target="_blank" rel="noreferrer" className="underline mr-1">צפה</a></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SPECS TAB ────────────────────────────────────────── */}
      {tab === 'specs' && (
        <div className="space-y-4">
          {/* Existing specs */}
          {specs.length > 0 && (
            <div className="space-y-2">
              {specs.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-slate-100 font-medium">{s.marbleModelCode} · {s.finishType}</p>
                      <p className="text-slate-400 text-sm">{s.squareMeters} מ"ר</p>
                      {s.counterEdgeDetailing && <p className="text-slate-500 text-xs">קאנט: {s.counterEdgeDetailing}</p>}
                      <div className="flex gap-3 text-xs text-slate-500 mt-1">
                        {s.waterEdgeRequired && <span className="text-amber-400">קאנט מים ✓</span>}
                        {s.cooktopBaseFee > 0 && <span>כיריים: ₪{s.cooktopBaseFee}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteSpec(s.id)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-900/50">
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add spec form */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-slate-300 text-sm font-medium">+ הוסף מפרט שיש</p>

            <div className="grid grid-cols-2 gap-3">
              <SF label="סוג / קוד שיש *" value={specForm.marbleModelCode}
                  onChange={v => setSpecForm(f=>({...f,marbleModelCode:v}))} />
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">סיום פני שטח</label>
                <select value={specForm.finishType} onChange={e=>setSpecForm(f=>({...f,finishType:e.target.value}))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                             text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                  {FINISH_TYPES.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SF label='שטח (מ"ר) *' value={specForm.squareMeters} type="number"
                  onChange={v=>setSpecForm(f=>({...f,squareMeters:v}))} dir="ltr" />
              <SF label="קאנט (עיבוי)" value={specForm.counterEdgeDetailing}
                  onChange={v=>setSpecForm(f=>({...f,counterEdgeDetailing:v}))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SF label="עלות כיריים (₪)" value={specForm.cooktopBaseFee} type="number"
                  onChange={v=>setSpecForm(f=>({...f,cooktopBaseFee:v}))} dir="ltr" />
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input type="checkbox" checked={specForm.waterEdgeRequired}
                  onChange={e=>setSpecForm(f=>({...f,waterEdgeRequired:e.target.checked}))}
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 h-4 w-4" />
                <span className="text-slate-300 text-sm">קאנט מים</span>
              </label>
            </div>

            <button onClick={addSpec} disabled={busy==='spec'}
              className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600
                         text-slate-200 text-sm disabled:opacity-50 transition-colors">
              {busy==='spec' ? 'שומר...' : '+ הוסף מפרט'}
            </button>
          </div>
        </div>
      )}

      {/* ── PHOTOS TAB ───────────────────────────────────────── */}
      {tab === 'photos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{photos.length} תמונות</p>
            <button onClick={() => photoRef.current?.click()} disabled={busy==='photo'}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600
                         text-slate-200 disabled:opacity-50 transition-colors">
              {busy==='photo' ? 'מעלה...' : '+ הוסף תמונה'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </div>

          {photos.length === 0 ? (
            <div className="rounded-xl border border-slate-700 p-10 text-center cursor-pointer
                            hover:border-slate-600 transition-colors"
                 onClick={() => photoRef.current?.click()}>
              <p className="text-4xl mb-3">📷</p>
              <p className="text-slate-500 text-sm">לחץ להוספת תמונה</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-lg overflow-hidden bg-slate-800 aspect-square">
                  <img src={p.fileUrl} alt="תמונת הזמנה"
                       className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <button onClick={() => deletePhoto(p.id)}
                    className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-red-700
                               text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity
                               flex items-center justify-center font-bold">
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more */}
              <div onClick={() => photoRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-700
                           hover:border-slate-500 cursor-pointer flex items-center justify-center
                           text-slate-600 hover:text-slate-400 transition-colors text-2xl">
                +
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOGISTICS TAB ────────────────────────────────────── */}
      {tab === 'logistics' && (
        <div className="space-y-4">
          {/* Installer assignment */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-slate-300 text-sm font-medium">שיבוץ מתקין</p>
            <div className="space-y-1">
              <label className="text-slate-400 text-xs">מתקין</label>
              <select value={logForm.installerId} onChange={e=>setLogForm(f=>({...f,installerId:e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                           text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                <option value="">בחר מתקין...</option>
                {installers.map(i=><option key={i.id} value={i.id}>{i.fullName} — {i.phoneNumber}</option>)}
              </select>
              {installers.length===0 && <p className="text-slate-600 text-xs">אין מתקינים רשומים עדיין</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">תאריך ושעה</label>
                <input type="datetime-local" value={logForm.date} dir="ltr"
                  onChange={e=>setLogForm(f=>({...f,date:e.target.value}))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                             text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">הערות למתקין</label>
                <input value={logForm.notes} onChange={e=>setLogForm(f=>({...f,notes:e.target.value}))}
                  placeholder="הנחיות גישה..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                             text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <button onClick={assignInstaller} disabled={busy==='logistics'}
              className="w-full py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600
                         text-white text-sm disabled:opacity-50 transition-colors">
              {busy==='logistics' ? 'משבץ...' : '📅 שבץ מתקין ותאריך'}
            </button>
          </div>

          {/* Access info summary */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-slate-400 text-xs font-medium">פרטי גישה לאתר</p>
            <p className="text-slate-200">{order.effectiveAddress}, {order.effectiveCity}</p>
            {order.effectiveFloor != null && (
              <p className="text-slate-400">קומה {order.effectiveFloor}{order.effectiveApt ? ` · דירה ${order.effectiveApt}` : ''}</p>
            )}
            {order.craneRequired && <p className="text-amber-400 text-xs">⚠ נדרש מנוף (על חשבון הלקוח)</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function SF({ label, value, onChange, type='text', dir }: { label:string; value:string; onChange:(v:string)=>void; type?:string; dir?:string }) {
  return (
    <div className="space-y-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} dir={dir}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                   text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
    </div>
  )
}
