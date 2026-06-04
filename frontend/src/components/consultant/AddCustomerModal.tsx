import { useState } from 'react'
import axios from 'axios'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function AddCustomerModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', emailAddress: '',
    siteAddress: '', siteCity: '', siteFloor: '', siteApt: '',
    architectName: '', architectPhone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await axios.post('/api/v1/customers', {
        ...form,
        siteFloor: form.siteFloor ? parseInt(form.siteFloor) : null,
        siteApt: form.siteApt || null,
        architectName: form.architectName || null,
        architectPhone: form.architectPhone || null,
      })
      onCreated()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'שגיאה בשמירת הלקוח')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-slate-100 font-semibold">הוסף לקוח חדש</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Required fields */}
          <div className="grid grid-cols-1 gap-4">
            <Field label="שם מלא *" value={form.fullName} onChange={v => set('fullName', v)} required />
            <Field label="טלפון *" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} required dir="ltr" />
            <Field label='דוא"ל *' value={form.emailAddress} onChange={v => set('emailAddress', v)} required dir="ltr" type="email" />
          </div>

          <hr className="border-slate-700" />
          <p className="text-slate-400 text-xs font-medium">כתובת האתר</p>

          <div className="grid grid-cols-1 gap-3">
            <Field label="כתובת *" value={form.siteAddress} onChange={v => set('siteAddress', v)} required />
            <Field label="עיר *" value={form.siteCity} onChange={v => set('siteCity', v)} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="קומה" value={form.siteFloor} onChange={v => set('siteFloor', v)} type="number" />
              <Field label="דירה" value={form.siteApt} onChange={v => set('siteApt', v)} />
            </div>
          </div>

          <hr className="border-slate-700" />
          <p className="text-slate-400 text-xs font-medium">אדריכל / מעצב (אופציונלי)</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="שם אדריכל" value={form.architectName} onChange={v => set('architectName', v)} />
            <Field label="טלפון אדריכל" value={form.architectPhone} onChange={v => set('architectPhone', v)} dir="ltr" />
          </div>

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
              {saving ? 'שומר...' : 'שמור לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, required, dir, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; dir?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        dir={dir}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                   text-slate-100 text-sm focus:outline-none focus:border-emerald-500
                   placeholder:text-slate-600"
      />
    </div>
  )
}
