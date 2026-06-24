import { useState } from 'react'
import axios from 'axios'
import type { CustomerResponse } from '../../api/customers'
import { PHONE_PATTERN, PHONE_TITLE_HE, sanitizePhoneInput } from '../../lib/constants'
import CitySelect from '../shared/CitySelect'

interface Props {
  onClose: () => void
  onCreated: (customer: CustomerResponse) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\d{10}$/

function phoneError(v: string) { return v && !PHONE_RE.test(v) ? PHONE_TITLE_HE : '' }
function emailError(v: string) { return v && !EMAIL_RE.test(v) ? 'כתובת דוא"ל לא תקינה' : '' }

export default function AddCustomerModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', emailAddress: '',
    siteAddress: '', siteCity: '', siteFloor: '', siteApt: '',
    architectName: '', architectPhone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Touch on every keystroke — real-time validation
  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setTouched(t => ({ ...t, [field]: true }))
  }

  // Also touch on blur so fields skipped without typing (e.g. city) still turn red if empty
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await axios.post<CustomerResponse>('/api/v1/customers', {
        ...form,
        siteFloor: form.siteFloor ? parseInt(form.siteFloor) : null,
        siteApt: form.siteApt || null,
        architectName: form.architectName || null,
        architectPhone: form.architectPhone || null,
      })
      onCreated(data)
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
            <Field label="שם מלא *" value={form.fullName} onChange={v => set('fullName', v)}
                   onBlur={() => touch('fullName')} required touched={!!touched.fullName} />
            <Field label="טלפון *" value={form.phoneNumber} onChange={v => set('phoneNumber', sanitizePhoneInput(v))}
                   onBlur={() => touch('phoneNumber')} error={phoneError(form.phoneNumber)}
                   required dir="ltr" type="tel" inputMode="numeric" maxLength={10}
                   pattern={PHONE_PATTERN} title={PHONE_TITLE_HE} touched={!!touched.phoneNumber} />
            <Field label='דוא"ל *' value={form.emailAddress} onChange={v => set('emailAddress', v)}
                   onBlur={() => touch('emailAddress')} error={emailError(form.emailAddress)}
                   required dir="ltr" type="email" touched={!!touched.emailAddress} />
          </div>

          <hr className="border-slate-700" />
          <p className="text-slate-400 text-xs font-medium">כתובת האתר</p>

          <div className="grid grid-cols-1 gap-3">
            <Field label="כתובת *" value={form.siteAddress} onChange={v => set('siteAddress', v)}
                   onBlur={() => touch('siteAddress')} required touched={!!touched.siteAddress} />
            <CitySelect label="עיר *" value={form.siteCity} onChange={v => set('siteCity', v)}
                        required touched={!!touched.siteCity} onBlur={() => touch('siteCity')} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="קומה" value={form.siteFloor} onChange={v => set('siteFloor', v)}
                     onBlur={() => touch('siteFloor')} type="number" touched={!!touched.siteFloor} />
              <Field label="דירה" value={form.siteApt} onChange={v => set('siteApt', v)}
                     onBlur={() => touch('siteApt')} touched={!!touched.siteApt} />
            </div>
          </div>

          <hr className="border-slate-700" />
          <p className="text-slate-400 text-xs font-medium">אדריכל / מעצב (אופציונלי)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="שם אדריכל" value={form.architectName} onChange={v => set('architectName', v)}
                   onBlur={() => touch('architectName')} touched={!!touched.architectName} />
            <Field label="טלפון אדריכל" value={form.architectPhone}
                   onChange={v => set('architectPhone', sanitizePhoneInput(v))}
                   onBlur={() => touch('architectPhone')} error={phoneError(form.architectPhone)}
                   dir="ltr" type="tel" inputMode="numeric" maxLength={10}
                   pattern={PHONE_PATTERN} title={PHONE_TITLE_HE} touched={!!touched.architectPhone} />
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

function Field({ label, value, onChange, onBlur, error, required, dir, type = 'text', inputMode, maxLength, pattern, title, touched }: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string;
  required?: boolean; dir?: string; type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number; pattern?: string; title?: string;
  touched?: boolean;
}) {
  let borderCls: string
  if (!touched) {
    borderCls = 'border-slate-600 focus:border-emerald-500'
  } else if (error) {
    borderCls = 'border-red-500 focus:border-red-500'
  } else if (value.trim()) {
    borderCls = 'border-emerald-500 focus:border-emerald-500'
  } else if (required) {
    borderCls = 'border-red-500 focus:border-red-500'
  } else {
    borderCls = 'border-slate-600 focus:border-emerald-500'
  }

  return (
    <div className="space-y-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        dir={dir}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 text-sm
                    focus:outline-none placeholder:text-slate-600 transition-colors ${borderCls}`}
      />
      {touched && error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
    </div>
  )
}
