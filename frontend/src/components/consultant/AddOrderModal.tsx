import { useEffect, useState } from 'react'
import axios from 'axios'
import { fetchActiveCustomers, type CustomerResponse } from '../../api/customers'
import type { OrderResponse } from '../../api/orders'
import CitySelect from '../shared/CitySelect'

const FINISH_TYPES = ['מבריק', 'מלוטש', 'מט', 'חלק', 'מוברש']

interface Props {
  onClose: () => void
  onCreated: (order: OrderResponse) => void
  preselectedCustomerId?: string
}

export default function AddOrderModal({ onClose, onCreated, preselectedCustomerId }: Props) {
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [form, setForm] = useState({
    customerId: preselectedCustomerId ?? '',
    totalGrossAmount: '',
    notes: '',
    siteAddress: '', siteCity: '', siteFloor: '', siteApt: '',
    elevatorWidthMeters: '', elevatorHeightMeters: '',
    craneRequired: false,
    // Marble specification — optional at creation time; can also be added later from the order's "specs" tab
    marbleModelCode: '', finishType: 'מבריק', squareMeters: '',
    counterEdgeDetailing: '', waterEdgeRequired: false, cooktopBaseFee: '200',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActiveCustomers().then(setCustomers)
  }, [])

  // When customer is selected, pre-fill address from their record
  function handleCustomerChange(id: string) {
    const c = customers.find(x => x.id === id)
    setForm(f => ({
      ...f,
      customerId: id,
      siteAddress: c?.siteAddress ?? '',
      siteCity:    c?.siteCity ?? '',
      siteFloor:   c?.siteFloor != null ? String(c.siteFloor) : '',
      siteApt:     c?.siteApt ?? '',
    }))
  }

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerId) { setError('בחר לקוח'); return }

    // Both fields are required for the spec to be saved — if she's started filling marble
    // details but left one out, block here instead of silently dropping the spec later
    const startedMarbleSpec = !!(form.marbleModelCode || form.squareMeters)
    if (startedMarbleSpec && !(form.marbleModelCode && form.squareMeters)) {
      setError('כדי לשמור את פרטי השיש יש למלא גם "סוג / קוד שיש" וגם "שטח (מ"ר)" — או להשאיר את שניהם ריקים ולמלא מאוחר יותר מתוך ההזמנה')
      return
    }

    setSaving(true)
    setError('')
    let created: OrderResponse
    try {
      const { data } = await axios.post<OrderResponse>('/api/v1/orders', {
        customerId: form.customerId,
        // Often unknown until after the on-site measurement — optional
        totalGrossAmount: form.totalGrossAmount || null,
        notes: form.notes || null,
        // Send address overrides only if they differ from customer defaults
        siteAddress: form.siteAddress || null,
        siteCity:    form.siteCity    || null,
        siteFloor:   form.siteFloor   ? parseInt(form.siteFloor) : null,
        siteApt:     form.siteApt     || null,
        elevatorWidthMeters:  form.elevatorWidthMeters  || null,
        elevatorHeightMeters: form.elevatorHeightMeters || null,
        craneRequired: form.craneRequired,
      })
      created = data
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'שגיאה ביצירת ההזמנה')
      setSaving(false)
      return
    }

    // Optional marble spec, filled in right at creation time instead of later via the order's "מפרט" tab.
    // The order itself is already saved at this point — if attaching the spec fails, still proceed to
    // the order's page (rather than showing a misleading "order creation failed" error) so she can add
    // it from there instead of losing the new order altogether.
    if (form.marbleModelCode && form.squareMeters) {
      try {
        await axios.post(`/api/v1/orders/${created.id}/materials`, {
          marbleModelCode: form.marbleModelCode,
          finishType: form.finishType,
          squareMeters: parseFloat(form.squareMeters),
          counterEdgeDetailing: form.counterEdgeDetailing || null,
          waterEdgeRequired: form.waterEdgeRequired,
          cooktopBaseFee: parseFloat(form.cooktopBaseFee || '200'),
        })
      } catch {
        setSaving(false)
        onCreated(created)
        return
      }
    }

    setSaving(false)
    onCreated(created)
  }

  const selectedCustomer = customers.find(c => c.id === form.customerId)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-slate-100 font-semibold">הזמנה חדשה</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Customer selector */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">לקוח *</label>
            <select
              value={form.customerId}
              onChange={e => handleCustomerChange(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">בחר לקוח...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} — {c.siteCity}</option>
              ))}
            </select>
          </div>

          {/* Customer address preview */}
          {selectedCustomer && (
            <div className="bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400">
              📍 {selectedCustomer.siteAddress}, {selectedCustomer.siteCity}
              {selectedCustomer.siteFloor != null && ` · קומה ${selectedCustomer.siteFloor}`}
            </div>
          )}

          {/* Total amount */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">
              סכום כולל (₪) <span className="text-slate-600">— אופציונלי, ניתן להשלים לאחר המדידה</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.totalGrossAmount}
              onChange={e => set('totalGrossAmount', e.target.value)}
              placeholder="למשל: 25000 (ניתן להשאיר ריק כרגע)"
              dir="ltr"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                         placeholder:text-slate-600"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">הערות</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="הערות כלליות על ההזמנה..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                         text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                         placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Address override */}
          <details className="space-y-3">
            <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300">
              שינוי כתובת משלוח (אופציונלי — ברירת מחדל מהלקוח)
            </summary>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <FieldSmall label="כתובת" value={form.siteAddress} onChange={v => set('siteAddress', v)} />
              <CitySelect label="עיר" value={form.siteCity} onChange={v => set('siteCity', v)} small />
              <div className="grid grid-cols-2 gap-3">
                <FieldSmall label="קומה" value={form.siteFloor} onChange={v => set('siteFloor', v)} type="number" />
                <FieldSmall label="דירה" value={form.siteApt}   onChange={v => set('siteApt', v)} />
              </div>
            </div>
          </details>

          {/* Logistics */}
          <details className="space-y-3">
            <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300">
              פרטי לוגיסטיקה (אופציונלי)
            </summary>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <FieldSmall label='רוחב מעלית (מ")' value={form.elevatorWidthMeters}
                          onChange={v => set('elevatorWidthMeters', v)} type="number" dir="ltr" />
              <FieldSmall label='גובה מעלית (מ")' value={form.elevatorHeightMeters}
                          onChange={v => set('elevatorHeightMeters', v)} type="number" dir="ltr" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.craneRequired}
                     onChange={e => set('craneRequired', e.target.checked)}
                     className="rounded border-slate-600 bg-slate-800 text-emerald-500" />
              <span className="text-slate-300 text-sm">נדרש מנוף</span>
              <span className="text-slate-500 text-xs">(על חשבון הלקוח)</span>
            </label>
          </details>

          {/* Marble specification — optional; can also be added later from the order's "מפרט" tab */}
          <details className="space-y-3">
            <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300">
              פרטי שיש (אופציונלי — אפשר למלא כבר עכשיו או מאוחר יותר מתוך ההזמנה)
            </summary>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <FieldSmall label="סוג / קוד שיש" value={form.marbleModelCode}
                          onChange={v => set('marbleModelCode', v)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs">סוג גימור</label>
                  <select value={form.finishType} onChange={e => set('finishType', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5
                               text-slate-100 text-sm focus:outline-none focus:border-emerald-500">
                    {FINISH_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
                <FieldSmall label='שטח (מ"ר)' value={form.squareMeters} type="number"
                            onChange={v => set('squareMeters', v)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldSmall label="קאנט (עיבוי קאנט)" value={form.counterEdgeDetailing}
                            onChange={v => set('counterEdgeDetailing', v)} />
                <FieldSmall label="עלות כיריים (₪)" value={form.cooktopBaseFee} type="number"
                            onChange={v => set('cooktopBaseFee', v)} dir="ltr" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.waterEdgeRequired}
                       onChange={e => set('waterEdgeRequired', e.target.checked)}
                       className="rounded border-slate-600 bg-slate-800 text-emerald-500" />
                <span className="text-slate-300 text-sm">נדרש קאנט מים</span>
              </label>
              <p className="text-slate-600 text-xs">* יש למלא סוג שיש ושטח כדי שהמפרט יישמר עם ההזמנה</p>
            </div>
          </details>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300
                         hover:bg-slate-800 text-sm transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                         text-white font-medium text-sm disabled:opacity-50 transition-colors">
              {saving ? 'יוצר...' : 'צור הזמנה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FieldSmall({ label, value, onChange, type = 'text', dir }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-slate-500 text-xs">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} dir={dir}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5
                   text-slate-100 text-sm focus:outline-none focus:border-emerald-500" />
    </div>
  )
}
