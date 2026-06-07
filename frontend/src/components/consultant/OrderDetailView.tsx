import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import type { OrderResponse } from '../../api/orders'
import { ORDER_STATUS_HE } from '../../api/orders'
import { createCalendarEvent } from '../../api/calendar'

/* ── Types ──────────────────────────────────────────────────────────── */
interface Photo      { id: string; fileUrl: string }
interface MatSpec    { id: string; marbleModelCode: string; finishType: string; squareMeters: number; counterEdgeDetailing: string; waterEdgeRequired: boolean; cooktopBaseFee: number }
interface SinkSpec   { id: string; brand: string; modelName: string; widthMm: number; heightMm: number; depthMm: number; color: string; mountingStyle: string }
interface Sig        { category: string; signedAt: string }
interface LedgerEntry{ id: string; amountAllocated: number; milestoneTier: number; cleared: boolean }

type Tab = 'workflow' | 'specs' | 'photos'

/* ── Status ordering ────────────────────────────────────────────────── */
const STATUS_STEPS = [
  { status: 'QUOTATION',                   label: 'הצעת מחיר' },
  { status: 'CLOSED_AWAITING_MEASUREMENT', label: 'ממתין למדידה' },
  { status: 'REVIEWING_LAYOUT',            label: 'בדיקת תוכנית' },
  { status: 'PRODUCTION',                  label: 'ייצור' },
  { status: 'AWAITING_INSTALLATION',       label: 'ממתין להתקנה' },
  { status: 'COMPLETED',                   label: 'הושלם' },
]
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
const FINISH_TYPES = ['מבריק', 'מלוטש', 'מט', 'חלק', 'מוברש']

/** Adds whole hours to an "HH:mm" string, wrapping past midnight. */
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h + hours) % 24
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/* ── Props ──────────────────────────────────────────────────────────── */
interface Props { order: OrderResponse; onBack: () => void; onUpdated: () => void }

export default function OrderDetailView({ order, onBack, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('workflow')
  const [photos, setPhotos]   = useState<Photo[]>([])
  const [specs, setSpecs]     = useState<MatSpec[]>([])
  const [sinks, setSinks]     = useState<SinkSpec[]>([])
  const [sigs, setSigs]       = useState<Sig[]>([])
  const [ledger, setLedger]   = useState<LedgerEntry[]>([])
  const [notes, setNotes]     = useState(order.notes ?? '')
  const [amountDraft, setAmountDraft] = useState(order.totalGrossAmount != null ? String(order.totalGrossAmount) : '')
  const [msg, setMsg]         = useState<{ text: string; ok: boolean }>({ text: '', ok: true })
  const [busy, setBusy]       = useState('')

  /* step-2 checkboxes */
  const [measurerPaid, setMeasurerPaid]     = useState(false)
  const [layoutArrived, setLayoutArrived]   = useState(false)

  /* measurement upload */
  const [measureNote, setMeasureNote]       = useState('')
  const [localMeasureUrl, setLocalMeasureUrl] = useState(order.measurementsDocumentUrl ?? '')

  /* send to customer */
  const [sendChannel, setSendChannel] = useState<'EMAIL' | 'WHATSAPP'>('WHATSAPP')
  const [portalLink, setPortalLink]   = useState('')
  const [copied, setCopied]           = useState(false)

  /* measurement scheduling — picked when closing the deal so the measurer's visit lands on the calendar */
  const [measureSchedule, setMeasureSchedule] = useState({ date: '', time: '' })

  /* logistics */
  const [installers, setInstallers] = useState<any[]>([])
  const [logForm, setLogForm] = useState({ installerId: '', date: '', notes: '' })

  /* specs form */
  const [specForm, setSpecForm] = useState({ marbleModelCode: '', finishType: 'מבריק', squareMeters: '', counterEdgeDetailing: '', waterEdgeRequired: false, cooktopBaseFee: '200' })
  const [sinkForm, setSinkForm] = useState({ brand: '', modelName: '', widthMm: '', heightMm: '', depthMm: '', color: '', mountingStyle: 'UNDERMOUNT' })
  const [specsTab, setSpecsTab] = useState<'marble' | 'sinks'>('marble')

  const photoRef   = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLInputElement>(null)
  const layoutRef  = useRef<HTMLInputElement>(null)

  function flash(text: string, ok = true) { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 4000) }

  function reloadOrderData() {
    axios.get(`/api/v1/orders/${order.id}/photos`).then(r => setPhotos(r.data)).catch(() => {})
    axios.get(`/api/v1/orders/${order.id}/materials`).then(r => setSpecs(r.data)).catch(() => {})
    axios.get(`/api/v1/orders/${order.id}/sinks`).then(r => setSinks(r.data)).catch(() => {})
    axios.get(`/api/v1/orders/${order.id}/signatures`).then(r => setSigs(r.data)).catch(() => {})
    axios.get(`/api/v1/orders/${order.id}/payments`).then(r => setLedger(r.data)).catch(() => {})
    axios.get('/api/v1/auth/users/installers').then(r => setInstallers(r.data)).catch(() => {})
  }

  // Reload when order changes (catches status changes after upload)
  useEffect(() => { reloadOrderData() }, [order.id, order.status])

  // Keep local measurement URL in sync with refreshed order prop
  useEffect(() => {
    if (order.measurementsDocumentUrl) setLocalMeasureUrl(order.measurementsDocumentUrl)
  }, [order.measurementsDocumentUrl])

  const layoutSigned = sigs.some(s => s.category === 'SLAB_LAYOUT_APPROVAL')
  const depositCleared = ledger.some(l => l.milestoneTier === 1 && l.cleared)
  const stepIndex = STATUS_STEPS.findIndex(s => s.status === order.status)

  /* ── Actions ──────────────────────────────────────────────────────── */
  const measurerFeeAmount = order.totalGrossAmount != null ? Number(order.totalGrossAmount) * 0.2 : 0

  async function recordMeasurerPayment() {
    if (!measurerPaid) { flash('יש לסמן אישור תשלום למודד', false); return }
    setBusy('measurer')
    try {
      const entry = await axios.post(`/api/v1/orders/${order.id}/payments`, {
        amountAllocated: measurerFeeAmount.toFixed(2),
        milestoneTier: 1,
      })
      await axios.put(`/api/v1/orders/${order.id}/payments/${entry.data.id}/clear`)
      flash('תשלום למודד נרשם')
      setLedger(l => [...l, { ...entry.data, cleared: true }])
      setMeasurerPaid(false)
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה', false) }
    finally { setBusy('') }
  }

  async function advanceTo(target: string) {
    setBusy('advance')
    try {
      await axios.put(`/api/v1/orders/${order.id}/status`, { targetStatus: target })
      flash('סטטוס עודכן')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'לא ניתן להתקדם — בדוק שהתנאים מולאו', false) }
    finally { setBusy('') }
  }

  /** Closes the deal and books a 4-hour arrival window for the measurer's site visit on the shared calendar (visible to Hotman too). */
  async function closeDealAndScheduleMeasurement() {
    if (!measureSchedule.date || !measureSchedule.time) { flash('בחר תאריך ושעת התחלה להגעת המודד', false); return }
    setBusy('advance')
    try {
      const endTime = addHours(measureSchedule.time, 4)
      await axios.put(`/api/v1/orders/${order.id}/status`, { targetStatus: 'CLOSED_AWAITING_MEASUREMENT' })
      await createCalendarEvent({
        title: `מדידה — ${order.customerFullName}`,
        eventType: 'MEASUREMENT',
        relatedOrderId: order.id,
        eventDate: measureSchedule.date,
        startTime: measureSchedule.time,
        endTime,
      })
      flash(`העסקה נסגרה ונקבע תור למודד ביומן — בין ${measureSchedule.time} ל-${endTime}`)
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'לא ניתן להתקדם — בדוק שהתנאים מולאו', false) }
    finally { setBusy('') }
  }

  async function uploadMeasurement(file: File) {
    setBusy('measure')
    try {
      const fd = new FormData(); fd.append('file', file)
      if (measureNote) fd.append('notes', measureNote)
      const res = await axios.post(`/api/v1/orders/${order.id}/measurements`, fd)
      // Save URL immediately so it shows before the order refresh completes
      const url = res.data?.measurementsDocumentUrl ?? ''
      if (url) setLocalMeasureUrl(url)
      flash('מדידות הועלו בהצלחה ✓')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה בהעלאה', false) }
    finally { setBusy('') }
  }

  async function uploadLayout(file: File) {
    setBusy('layout')
    try {
      const fd = new FormData(); fd.append('file', file)
      await axios.post(`/api/v1/orders/${order.id}/layout`, fd)
      flash('תוכנית הפריסה הועלתה')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה בהעלאה', false) }
    finally { setBusy('') }
  }

  async function sendToCustomer() {
    setBusy('send')
    try {
      const res = await axios.post('/api/v1/portal/auth/request', { customerId: order.customerId, channel: sendChannel })
      const url = res.data?.portalUrl ?? ''
      setPortalLink(url)
      flash(`✓ קישור נשלח${sendChannel === 'WHATSAPP' ? ' לוואטסאפ' : ' למייל'} — ניתן גם להעתיק ידנית`)
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה בשליחה', false) }
    finally { setBusy('') }
  }

  async function copyPortalLink() {
    try {
      await navigator.clipboard.writeText(portalLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch { flash('לא ניתן להעתיק — העתיקי ידנית', false) }
  }

  async function uploadPhoto(file: File) {
    setBusy('photo')
    try {
      const fd = new FormData()
      fd.append('file', file)
      flash('תמונה הועלתה')
      // Reload from server to ensure consistent state
      axios.get(`/api/v1/orders/${order.id}/photos`).then(r => setPhotos(r.data)).catch(() => {})
    } catch (e: any) {
      flash(e?.response?.data?.detail || `שגיאה: ${e?.response?.status ?? 'לא ידוע'}`, false)
    } finally { setBusy('') }
  }

  async function addSink() {
    if (!sinkForm.brand || !sinkForm.modelName) { flash('מלא מותג ודגם', false); return }
    setBusy('sink')
    try {
      const r = await axios.post(`/api/v1/orders/${order.id}/sinks`, {
        ...sinkForm,
        widthMm:  parseInt(sinkForm.widthMm)  || 0,
        heightMm: parseInt(sinkForm.heightMm) || 0,
        depthMm:  parseInt(sinkForm.depthMm)  || 0,
      })
      setSinks(s => [...s, { ...sinkForm, id: r.data.id, widthMm: parseInt(sinkForm.widthMm)||0, heightMm: parseInt(sinkForm.heightMm)||0, depthMm: parseInt(sinkForm.depthMm)||0 }])
      setSinkForm({ brand:'', modelName:'', widthMm:'', heightMm:'', depthMm:'', color:'', mountingStyle:'UNDERMOUNT' })
      flash('כיור נוסף')
    } catch { flash('שגיאה', false) }
    finally { setBusy('') }
  }

  async function addSpec() {
    if (!specForm.marbleModelCode || !specForm.squareMeters) { flash('מלא סוג שיש ומ"ר', false); return }
    setBusy('spec')
    try {
      const r = await axios.post(`/api/v1/orders/${order.id}/materials`, { ...specForm, squareMeters: parseFloat(specForm.squareMeters), cooktopBaseFee: parseFloat(specForm.cooktopBaseFee || '200') })
      setSpecs(s => [...s, { ...specForm, id: r.data.id, squareMeters: parseFloat(specForm.squareMeters), cooktopBaseFee: parseFloat(specForm.cooktopBaseFee || '200'), waterEdgeRequired: specForm.waterEdgeRequired }])
      setSpecForm({ marbleModelCode: '', finishType: 'מבריק', squareMeters: '', counterEdgeDetailing: '', waterEdgeRequired: false, cooktopBaseFee: '200' })
      flash('מפרט נוסף')
    } catch { flash('שגיאה', false) }
    finally { setBusy('') }
  }

  async function assignInstaller() {
    if (!logForm.installerId || !logForm.date) { flash('בחר מתקין ותאריך', false); return }
    setBusy('logistics')
    try {
      await axios.post(`/api/v1/orders/${order.id}/logistics`, { installerUserId: logForm.installerId, deliveryScheduledDate: new Date(logForm.date).toISOString(), primary: true, installerNotes: logForm.notes || null })
      flash('המתקין שובץ — אירוע נוסף ללוח השנה')
      onUpdated()
    } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה', false) }
    finally { setBusy('') }
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="p-4 space-y-4 max-w-2xl" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm shrink-0">← חזרה</button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 font-semibold truncate">{order.customerFullName}</p>
          <p className="text-slate-500 text-xs truncate">{order.effectiveAddress}, {order.effectiveCity}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.status] ?? 'bg-slate-700 text-slate-300'}`}>
          {ORDER_STATUS_HE[order.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((s, i) => {
          const done    = i < stepIndex
          const current = i === stepIndex
          return (
            <div key={s.status} className="flex items-center flex-1 min-w-0">
              <div className={`flex flex-col items-center gap-1 ${i === STATUS_STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${done ? 'bg-emerald-600 text-white' : current ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-center text-xs leading-tight hidden sm:block ${current ? 'text-emerald-400 font-medium' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${i < stepIndex ? 'bg-emerald-600' : 'bg-slate-700'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Flash message */}
      {msg.text && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>
          {msg.text}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {([['workflow','תהליך'],['specs', `מפרט${(specs.length+sinks.length) ? ` (${specs.length+sinks.length})` : ''}`],['photos', `תמונות${photos.length ? ` (${photos.length})` : ''}`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm transition-colors ${tab === id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ WORKFLOW TAB ═══════════════════════════════════════════════ */}
      {tab === 'workflow' && (
        <div className="space-y-4">

          {/* Summary row */}
          <div className="flex flex-wrap items-end gap-4 text-sm bg-slate-900 rounded-xl border border-slate-700 p-3">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">סכום כולל</p>
              {order.totalGrossAmount == null ? (
                <p className="text-amber-400 text-xs">טרם נקבע — יוגדר לאחר המדידה</p>
              ) : (
                <p className="text-emerald-300 font-semibold">₪{Number(order.totalGrossAmount).toLocaleString('he-IL')}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0.01" step="0.01" value={amountDraft} dir="ltr"
                onChange={e => setAmountDraft(e.target.value)}
                placeholder="הזן/עדכן סכום..."
                className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600" />
              <button
                onClick={async () => {
                  setBusy('amount')
                  try {
                    await axios.put(`/api/v1/orders/${order.id}`, { totalGrossAmount: amountDraft || null })
                    flash('הסכום עודכן')
                    onUpdated()
                  } catch (e: any) { flash(e?.response?.data?.detail || 'שגיאה בעדכון הסכום', false) }
                  finally { setBusy('') }
                }}
                disabled={busy === 'amount'}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50">
                {busy === 'amount' ? '...' : 'עדכן סכום'}
              </button>
            </div>
            <div><p className="text-slate-500 text-xs">פתיחה</p><p className="text-slate-300">{new Date(order.createdAt).toLocaleDateString('he-IL')}</p></div>
            {depositCleared && <div><p className="text-slate-500 text-xs">מקדמה</p><p className="text-emerald-400 text-xs">✓ שולמה</p></div>}
            {layoutSigned && <div><p className="text-slate-500 text-xs">תוכנית</p><p className="text-emerald-400 text-xs">✓ חתומה</p></div>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-medium">הערות כלליות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="הוסף הערות..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 resize-none" />
            <button onClick={async () => { setBusy('notes'); try { await axios.put(`/api/v1/orders/${order.id}`, { notes }); flash('נשמר'); onUpdated() } catch { flash('שגיאה', false) } finally { setBusy('') } }}
              disabled={busy === 'notes'}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50">
              {busy === 'notes' ? '...' : 'שמור הערות'}
            </button>
          </div>

          {/* ── STEP 1: QUOTATION — close the deal ────────────────── */}
          {order.status === 'QUOTATION' && (
            <StepCard title="שלב 1 — סגירת עסקה" color="blue">
              <p className="text-slate-400 text-xs mb-4">
                הלקוח קיבל את הצעת המחיר הראשונית. לאחר שהגיעו להסכמה — סגרי את העסקה וקבעי תווך הגעה למודד באתר
                (תווך קבוע של 4 שעות); התור יופיע ביומן גם אצל מנהל המפעל.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">תאריך הגעת המודד</label>
                  <input type="date" value={measureSchedule.date} dir="ltr"
                    onChange={e => setMeasureSchedule(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">תחילת התווך (4 שעות)</label>
                  <input type="time" value={measureSchedule.time} dir="ltr"
                    onChange={e => setMeasureSchedule(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              {measureSchedule.time && (
                <p className="text-slate-500 text-xs mb-3">
                  המודד יגיע בין השעה <span className="text-slate-300 font-medium" dir="ltr">{measureSchedule.time}</span> לבין
                  {' '}<span className="text-slate-300 font-medium" dir="ltr">{addHours(measureSchedule.time, 4)}</span>
                </p>
              )}
              {!measureSchedule.time && <div className="mb-3" />}
              <button onClick={closeDealAndScheduleMeasurement} disabled={busy === 'advance'}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
                {busy === 'advance' ? '...' : '✓ סגור עסקה — קבע תור למודד'}
              </button>
            </StepCard>
          )}

          {/* ── STEP 2: CLOSED_AWAITING_MEASUREMENT ───────────────── */}
          {order.status === 'CLOSED_AWAITING_MEASUREMENT' && (
            <StepCard title="שלב 2 — מדידה, תשלום מודד ואישור תוכנית" color="amber">

              {/* 2A: Upload measurements */}
              <div className="space-y-2 mb-4">
                <p className="text-slate-300 text-xs font-medium">א. העלאת מדידות (אופציונלי)</p>
                <textarea value={measureNote} onChange={e => setMeasureNote(e.target.value)} rows={2}
                  placeholder="הערות מדידה..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 resize-none placeholder:text-slate-600" />
                <button onClick={() => measureRef.current?.click()} disabled={busy === 'measure'}
                  className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50 transition-colors">
                  {busy === 'measure' ? '⏳ מעלה...' : '📐 העלה קובץ מדידות'}
                </button>
                <input ref={measureRef} type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg,.heic" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadMeasurement(e.target.files[0])} />
                {localMeasureUrl && (
                  <div className="flex items-center justify-between bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2">
                    <span className="text-emerald-300 text-xs font-medium">✓ מדידות הועלו</span>
                    <a href={localMeasureUrl} target="_blank" rel="noreferrer"
                      className="text-emerald-400 text-xs hover:underline">צפה ↗</a>
                  </div>
                )}
              </div>

              <hr className="border-slate-700 mb-4" />

              {/* 2B + 2C: Checkboxes — both required to advance */}
              <p className="text-slate-300 text-xs font-medium mb-3">ב. אישורים לפני המשך</p>

              {/* Checkbox 1: Measurer paid */}
              {order.totalGrossAmount == null ? (
                <div className="mb-3 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
                  <p className="text-amber-300 text-sm">יש להזין סכום כולל להזמנה (ראו בראש העמוד) לפני אישור תשלום למודד</p>
                </div>
              ) : depositCleared ? (
                <div className="flex items-center gap-2 mb-3 bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-emerald-300 text-sm">תשלום למודד אושר — ₪{measurerFeeAmount.toLocaleString('he-IL')}</span>
                </div>
              ) : (
                <div className="mb-3 space-y-2">
                  <div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">תשלום למודד (20%)</span>
                    <span className="text-amber-300 font-bold">₪{measurerFeeAmount.toLocaleString('he-IL')}</span>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-amber-600 transition-colors">
                    <input type="checkbox" checked={measurerPaid} onChange={e => setMeasurerPaid(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-500 bg-slate-700 cursor-pointer accent-amber-500" />
                    <div>
                      <p className="text-slate-200 text-sm font-medium">שילמתי למודד</p>
                      <p className="text-slate-500 text-xs">אני מאשרת שהתשלום בוצע בפועל</p>
                    </div>
                  </label>
                  <button onClick={recordMeasurerPayment} disabled={busy === 'measurer' || !measurerPaid}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {busy === 'measurer' ? '...' : 'אשר תשלום למודד'}
                  </button>
                </div>
              )}

              {/* Checkbox 2: Layout plan arrived */}
              <label className={`flex items-start gap-3 cursor-pointer rounded-xl p-3 border transition-colors mb-4
                ${layoutArrived ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-slate-800/50 border-slate-700 hover:border-emerald-600'}`}>
                <input type="checkbox" checked={layoutArrived} onChange={e => setLayoutArrived(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-500 bg-slate-700 cursor-pointer accent-emerald-500" />
                <div>
                  <p className={`text-sm font-medium ${layoutArrived ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {layoutArrived ? '✓ ' : ''}התוכנית הגיעה אלי
                  </p>
                  <p className="text-slate-500 text-xs">קיבלתי את תוכנית הפריסה מהמודד/מהמפעל</p>
                </div>
              </label>

              {/* Advance button — requires both checkboxes */}
              {depositCleared && layoutArrived ? (
                <button onClick={() => advanceTo('REVIEWING_LAYOUT')} disabled={busy === 'advance'}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                  {busy === 'advance' ? '...' : '✓ עבור לשלב בדיקת תוכנית ←'}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-slate-800 border border-dashed border-slate-700 text-center space-y-1">
                  {!depositCleared && <p className="text-amber-400 text-xs">⬆ יש לאשר תשלום למודד</p>}
                  {!layoutArrived  && <p className="text-slate-500 text-xs">⬆ יש לסמן שהתוכנית הגיעה</p>}
                </div>
              )}
            </StepCard>
          )}

          {/* ── STEP 3: REVIEWING_LAYOUT — send quote + wait for sig ── */}
          {order.status === 'REVIEWING_LAYOUT' && (
            <StepCard title="שלב 3 — הצעת מחיר מפורטת ואישור לקוח" color="purple">
              <p className="text-slate-400 text-xs mb-4">
                שלחי ללקוח את הצעת המחיר המפורטת עם התוכנית לאישור. ההזמנה תרד לייצור רק לאחר חתימה דיגיטלית.
              </p>

              {/* Document links */}
              <div className="space-y-2 mb-4">
                {order.measurementsDocumentUrl && (
                  <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">📐 קובץ מדידות</span>
                    <a href={order.measurementsDocumentUrl} target="_blank" rel="noreferrer"
                      className="text-blue-400 text-xs hover:underline">צפה ↗</a>
                  </div>
                )}
                {order.layoutDocumentUrl && (
                  <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">📄 תוכנית הפריסה</span>
                    <a href={order.layoutDocumentUrl} target="_blank" rel="noreferrer"
                      className="text-emerald-400 text-xs hover:underline">צפה ↗</a>
                  </div>
                )}
              </div>

              {/* Upload layout if not yet uploaded */}
              {!order.layoutDocumentUrl && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs mb-2">יש להעלות תוכנית פריסה לפני שליחה ללקוח:</p>
                  <button onClick={() => layoutRef.current?.click()} disabled={busy === 'layout'}
                    className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50 transition-colors">
                    {busy === 'layout' ? 'מעלה...' : '📄 העלה תוכנית פריסה (PDF)'}
                  </button>
                  <input ref={layoutRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadLayout(e.target.files[0])} />
                </div>
              )}

              {/* Send channel selector */}
              <div className="flex gap-2 mb-3">
                {(['WHATSAPP', 'EMAIL'] as const).map(ch => (
                  <button key={ch} onClick={() => setSendChannel(ch)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${sendChannel === ch ? 'bg-emerald-800/60 border-emerald-600 text-emerald-300 font-medium' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    {ch === 'WHATSAPP' ? '📱 וואטסאפ' : '📧 אימייל'}
                  </button>
                ))}
              </div>

              <button onClick={sendToCustomer} disabled={busy === 'send'}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors mb-3">
                {busy === 'send' ? 'שולח...' : `📤 שלח הצעה מפורטת ל${sendChannel === 'WHATSAPP' ? 'וואטסאפ' : 'אימייל'} של הלקוח`}
              </button>

              {/* Portal link — shown after sending so consultant can also share manually */}
              {portalLink && (
                <div className="mb-4 bg-slate-800 border border-purple-800/50 rounded-xl p-3 space-y-2">
                  <p className="text-slate-400 text-xs font-medium">קישור לשיתוף ידני (שלחי לוואטסאפ או אימייל):</p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-purple-300 text-xs font-mono break-all bg-slate-900 rounded px-2 py-1.5 select-all">
                      {portalLink}
                    </p>
                    <button onClick={copyPortalLink}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors">
                      {copied ? '✓ הועתק' : 'העתק'}
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs">⏱ הקישור תקף ל-24 שעות (אימייל) / 2 שעות (וואטסאפ)</p>
                </div>
              )}

              <hr className="border-slate-700 mb-4" />

              {/* Signature status */}
              <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-slate-300 text-sm font-medium">חתימה דיגיטלית של הלקוח</p>
                {layoutSigned
                  ? <span className="text-emerald-400 text-sm font-bold">✓ חתום — מאושר לייצור</span>
                  : <span className="text-amber-400 text-sm">ממתין לחתימה...</span>
                }
              </div>

              {layoutSigned ? (
                <button onClick={() => advanceTo('PRODUCTION')} disabled={busy === 'advance'}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                  {busy === 'advance' ? '...' : '🏭 הורד לייצור ←'}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 text-sm text-center border border-dashed border-slate-700">
                  ממתין לחתימה דיגיטלית של הלקוח על ההצעה
                </div>
              )}
            </StepCard>
          )}

          {/* ── STEP 4: PRODUCTION ───────────────────────────────── */}
          {order.status === 'PRODUCTION' && (
            <StepCard title="שלב 4 — בייצור במפעל" color="purple">
              <p className="text-slate-400 text-xs mb-3">הוטמן עובד על התוכנית. תוכלי לעקוב אחר ה-SLA בלוח הוטמן.</p>
              {order.factorySlaDeadline && (
                <p className="text-slate-300 text-sm mb-3">יעד ייצור: {new Date(order.factorySlaDeadline).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' })}</p>
              )}
              <button onClick={() => advanceTo('AWAITING_INSTALLATION')} disabled={busy === 'advance'}
                className="w-full py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                {busy === 'advance' ? '...' : 'ייצור הסתיים — ממתין להתקנה ←'}
              </button>
            </StepCard>
          )}

          {/* ── STEP 5: AWAITING_INSTALLATION ────────────────────── */}
          {(order.status === 'AWAITING_INSTALLATION' || order.status === 'PENDING_REPAIR') && (
            <StepCard title={order.status === 'PENDING_REPAIR' ? 'תיקון — שיבוץ מחדש' : 'שלב 5 — שיבוץ מתקין'} color="cyan">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs">מתקין</label>
                  <select value={logForm.installerId} onChange={e => setLogForm(f => ({ ...f, installerId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">בחר מתקין...</option>
                    {installers.map((i: any) => <option key={i.id} value={i.id}>{i.fullName} — {i.phoneNumber}</option>)}
                  </select>
                  {installers.length === 0 && <p className="text-slate-600 text-xs">אין מתקינים רשומים עדיין</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-xs">תאריך התקנה</label>
                    <input type="datetime-local" value={logForm.date} dir="ltr"
                      onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-xs">הערות למתקין</label>
                    <input value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <button onClick={assignInstaller} disabled={busy === 'logistics'}
                  className="w-full py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                  {busy === 'logistics' ? '...' : '📅 שבץ מתקין ותאריך'}
                </button>
                <button onClick={() => advanceTo('COMPLETED')} disabled={busy === 'advance'}
                  className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-50 transition-colors">
                  {busy === 'advance' ? '...' : '✓ סמן כהושלם (80% שולמה)'}
                </button>
              </div>
            </StepCard>
          )}

          {(order.status === 'COMPLETED' || order.status === 'ARCHIVED') && (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-emerald-400 font-semibold">ההזמנה הושלמה</p>
              {order.status === 'COMPLETED' && (
                <button onClick={() => advanceTo('ARCHIVED')} disabled={busy === 'advance'}
                  className="mt-3 text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-50">
                  ארכב הזמנה
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ SPECS TAB ══════════════════════════════════════════════════ */}
      {tab === 'specs' && (
        <div className="space-y-4">

          {/* Notes row */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-medium">הערות הזמנה</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="הוסף הערות לגבי ההזמנה..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 resize-none" />
            <button onClick={async () => { setBusy('notes'); try { await axios.put(`/api/v1/orders/${order.id}`, { notes }); flash('נשמר'); onUpdated() } catch { flash('שגיאה', false) } finally { setBusy('') } }}
              disabled={busy === 'notes'}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50">
              {busy === 'notes' ? '...' : 'שמור הערות'}
            </button>
          </div>

          {/* Sub-tabs: Marble / Sinks */}
          <div className="flex gap-1 border-b border-slate-800">
            <button onClick={() => setSpecsTab('marble')}
              className={`px-3 py-2 text-sm transition-colors ${specsTab==='marble' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              שיש ואבן {specs.length > 0 && `(${specs.length})`}
            </button>
            <button onClick={() => setSpecsTab('sinks')}
              className={`px-3 py-2 text-sm transition-colors ${specsTab==='sinks' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              כיורים {sinks.length > 0 && `(${sinks.length})`}
            </button>
          </div>

          {/* ── Marble specs ── */}
          {specsTab === 'marble' && (
            <div className="space-y-3">
              {specs.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-100 font-medium">{s.marbleModelCode} <span className="text-slate-400 font-normal text-sm">· {s.finishType}</span></p>
                    <p className="text-emerald-300 text-sm">{s.squareMeters} מ"ר</p>
                    {s.counterEdgeDetailing && <p className="text-slate-400 text-xs">קאנט: {s.counterEdgeDetailing}</p>}
                    <div className="flex gap-3 text-xs mt-1">
                      {s.waterEdgeRequired && <span className="text-amber-400">קאנט מים ✓</span>}
                      {s.cooktopBaseFee > 0 && <span className="text-slate-500">כיריים: ₪{s.cooktopBaseFee}</span>}
                    </div>
                  </div>
                  <button onClick={async () => { await axios.delete(`/api/v1/orders/${order.id}/materials/${s.id}`); setSpecs(p => p.filter(x => x.id !== s.id)) }}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 shrink-0">מחק</button>
                </div>
              ))}

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-slate-300 text-sm font-medium">+ הוסף סוג שיש</p>
                <div className="grid grid-cols-2 gap-3">
                  <SF label="סוג / קוד שיש *" value={specForm.marbleModelCode} onChange={v => setSpecForm(f => ({ ...f, marbleModelCode: v }))} />
                  <div className="space-y-1">
                    <label className="text-slate-400 text-xs">סיום פני שטח</label>
                    <select value={specForm.finishType} onChange={e => setSpecForm(f => ({ ...f, finishType: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                      {FINISH_TYPES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <SF label='שטח (מ"ר) *' value={specForm.squareMeters} type="number" onChange={v => setSpecForm(f => ({ ...f, squareMeters: v }))} dir="ltr" />
                  <SF label="קאנט (עיבוי קאנט)" value={specForm.counterEdgeDetailing} onChange={v => setSpecForm(f => ({ ...f, counterEdgeDetailing: v }))} />
                  <SF label="עלות כיריים (₪)" value={specForm.cooktopBaseFee} type="number" onChange={v => setSpecForm(f => ({ ...f, cooktopBaseFee: v }))} dir="ltr" />
                  <label className="flex items-center gap-2 cursor-pointer pt-5">
                    <input type="checkbox" checked={specForm.waterEdgeRequired} onChange={e => setSpecForm(f => ({ ...f, waterEdgeRequired: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500" />
                    <span className="text-slate-300 text-sm">קאנט מים</span>
                  </label>
                </div>
                <button onClick={addSpec} disabled={busy === 'spec'}
                  className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm disabled:opacity-50">
                  {busy === 'spec' ? '...' : '+ הוסף שיש'}
                </button>
              </div>
            </div>
          )}

          {/* ── Sink specs ── */}
          {specsTab === 'sinks' && (
            <div className="space-y-3">
              {sinks.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-100 font-medium">{s.brand} <span className="text-slate-400">· {s.modelName}</span></p>
                    <p className="text-slate-400 text-sm">{s.widthMm}×{s.heightMm}×{s.depthMm} מ"מ · {s.color}</p>
                    <p className="text-slate-500 text-xs">{s.mountingStyle === 'UNDERMOUNT' ? 'הטמנה מתחת' : 'הטמנה שטוחה'}</p>
                  </div>
                  <button onClick={async () => { await axios.delete(`/api/v1/orders/${order.id}/sinks/${s.id}`); setSinks(p => p.filter(x => x.id !== s.id)) }}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 shrink-0">מחק</button>
                </div>
              ))}

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-slate-300 text-sm font-medium">+ הוסף כיור</p>
                <div className="grid grid-cols-2 gap-3">
                  <SF label="מותג *" value={sinkForm.brand} onChange={v => setSinkForm(f => ({ ...f, brand: v }))} />
                  <SF label="דגם *" value={sinkForm.modelName} onChange={v => setSinkForm(f => ({ ...f, modelName: v }))} />
                  <SF label="רוחב (מ״מ)" value={sinkForm.widthMm} type="number" onChange={v => setSinkForm(f => ({ ...f, widthMm: v }))} dir="ltr" />
                  <SF label="עומק (מ״מ)" value={sinkForm.depthMm} type="number" onChange={v => setSinkForm(f => ({ ...f, depthMm: v }))} dir="ltr" />
                  <SF label="צבע" value={sinkForm.color} onChange={v => setSinkForm(f => ({ ...f, color: v }))} />
                  <div className="space-y-1">
                    <label className="text-slate-400 text-xs">סוג הטמנה</label>
                    <select value={sinkForm.mountingStyle} onChange={e => setSinkForm(f => ({ ...f, mountingStyle: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                      <option value="UNDERMOUNT">הטמנה מתחת</option>
                      <option value="FLUSH_MOUNT">הטמנה שטוחה</option>
                    </select>
                  </div>
                </div>
                <button onClick={addSink} disabled={busy === 'sink'}
                  className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm disabled:opacity-50">
                  {busy === 'sink' ? '...' : '+ הוסף כיור'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PHOTOS TAB ═════════════════════════════════════════════════ */}
      {tab === 'photos' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm">{photos.length} תמונות</p>
            <button onClick={() => photoRef.current?.click()} disabled={busy === 'photo'}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50">
              {busy === 'photo' ? 'מעלה...' : '+ הוסף תמונה'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </div>
          {photos.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-700 p-10 text-center cursor-pointer hover:border-slate-500 transition-colors"
                 onClick={() => photoRef.current?.click()}>
              <p className="text-4xl mb-2">📷</p>
              <p className="text-slate-500 text-sm">לחץ להוספת תמונה</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-lg overflow-hidden bg-slate-800 aspect-square">
                  <img src={p.fileUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <button onClick={async () => { await axios.delete(`/api/v1/orders/${order.id}/photos/${p.id}`); setPhotos(ph => ph.filter(x => x.id !== p.id)) }}
                    className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-red-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
                </div>
              ))}
              <div onClick={() => photoRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-700 hover:border-slate-500 cursor-pointer flex items-center justify-center text-slate-600 hover:text-slate-400 text-2xl transition-colors">+</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Helper components ─────────────────────────────────────────────── */
function StepCard({ title, children, color }: { title: string; children: React.ReactNode; color: 'blue' | 'amber' | 'purple' | 'cyan' }) {
  const border = { blue: 'border-blue-800/50', amber: 'border-amber-800/50', purple: 'border-purple-800/50', cyan: 'border-cyan-800/50' }[color]
  const header = { blue: 'text-blue-300', amber: 'text-amber-300', purple: 'text-purple-300', cyan: 'text-cyan-300' }[color]
  const bg     = { blue: 'bg-blue-950/20', amber: 'bg-amber-950/20', purple: 'bg-purple-950/20', cyan: 'bg-cyan-950/20' }[color]
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 space-y-2`}>
      <p className={`text-sm font-semibold ${header}`}>{title}</p>
      {children}
    </div>
  )
}

function SF({ label, value, onChange, type = 'text', dir }: { label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} dir={dir}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
    </div>
  )
}
