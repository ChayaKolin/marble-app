import { useState } from 'react'
import { type CustomerResponse, updateCustomer } from '../../api/customers'
import { PHONE_PATTERN, PHONE_TITLE_HE, sanitizePhoneInput } from '../../lib/constants'
import { formatDate } from '../../lib/formatters'
import CitySelect from '../shared/CitySelect'

interface Props {
  customer: CustomerResponse
  onClose: () => void
  onUpdated: (c: CustomerResponse) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\d{10}$/

function phoneError(v: string) { return v && !PHONE_RE.test(v) ? PHONE_TITLE_HE : '' }
function emailError(v: string) { return v && !EMAIL_RE.test(v) ? 'כתובת דוא"ל לא תקינה' : '' }

export default function EditCustomerModal({ customer, onClose, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName:       customer.fullName,
    phoneNumber:    customer.phoneNumber,
    emailAddress:   customer.emailAddress,
    siteAddress:    customer.siteAddress,
    siteCity:       customer.siteCity,
    siteFloor:      customer.siteFloor != null ? String(customer.siteFloor) : '',
    siteApt:        customer.siteApt ?? '',
    architectName:  customer.architectName ?? '',
    architectPhone: customer.architectPhone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setTouched(t => ({ ...t, [field]: true }))
  }
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await updateCustomer(customer.id, {
        fullName:       form.fullName,
        phoneNumber:    form.phoneNumber,
        emailAddress:   form.emailAddress,
        siteAddress:    form.siteAddress,
        siteCity:       form.siteCity,
        siteFloor:      form.siteFloor ? parseInt(form.siteFloor) : null,
        siteApt:        form.siteApt || null,
        architectName:  form.architectName || null,
        architectPhone: form.architectPhone || null,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'שגיאה בשמירת הלקוח')
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setForm({
      fullName:       customer.fullName,
      phoneNumber:    customer.phoneNumber,
      emailAddress:   customer.emailAddress,
      siteAddress:    customer.siteAddress,
      siteCity:       customer.siteCity,
      siteFloor:      customer.siteFloor != null ? String(customer.siteFloor) : '',
      siteApt:        customer.siteApt ?? '',
      architectName:  customer.architectName ?? '',
      architectPhone: customer.architectPhone ?? '',
    })
    setTouched({})
    setError('')
    setEditing(false)
  }

  const borderCls = (field: string, value: string, required?: boolean, errMsg?: string) => {
    if (!touched[field]) return 'border-slate-600 focus:border-emerald-500'
    if (errMsg) return 'border-red-500 focus:border-red-500'
    if (value.trim()) return 'border-emerald-500 focus:border-emerald-500'
    if (required) return 'border-red-500 focus:border-red-500'
    return 'border-slate-600 focus:border-emerald-500'
  }

  const inputCls = (field: string, value: string, required?: boolean, errMsg?: string) =>
    `w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none transition-colors ${borderCls(field, value, required, errMsg)}`

  const readonlyCls = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
              <span className="text-emerald-200 font-bold text-sm">{customer.fullName.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-slate-100 font-semibold text-sm">{customer.fullName}</h2>
              <p className="text-slate-500 text-xs">נוצר {formatDate(customer.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Personal details */}
          <section className="space-y-3">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">פרטים אישיים</p>

            <div className="space-y-1">
              <label className="text-slate-400 text-xs">שם מלא *</label>
              {editing ? (
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
                       onBlur={() => touch('fullName')}
                       className={inputCls('fullName', form.fullName, true)} />
              ) : (
                <p className={readonlyCls}>{customer.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">טלפון *</label>
                {editing ? (
                  <>
                    <input value={form.phoneNumber} dir="ltr" type="tel" inputMode="numeric"
                           maxLength={10} pattern={PHONE_PATTERN} title={PHONE_TITLE_HE}
                           onChange={e => set('phoneNumber', sanitizePhoneInput(e.target.value))}
                           onBlur={() => touch('phoneNumber')}
                           className={inputCls('phoneNumber', form.phoneNumber, true, phoneError(form.phoneNumber))} />
                    {touched.phoneNumber && phoneError(form.phoneNumber) && (
                      <p className="text-red-400 text-xs">{phoneError(form.phoneNumber)}</p>
                    )}
                  </>
                ) : (
                  <p className={readonlyCls} dir="ltr">{customer.phoneNumber}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">דוא"ל *</label>
                {editing ? (
                  <>
                    <input value={form.emailAddress} dir="ltr" type="email"
                           onChange={e => set('emailAddress', e.target.value)}
                           onBlur={() => touch('emailAddress')}
                           className={inputCls('emailAddress', form.emailAddress, true, emailError(form.emailAddress))} />
                    {touched.emailAddress && emailError(form.emailAddress) && (
                      <p className="text-red-400 text-xs">{emailError(form.emailAddress)}</p>
                    )}
                  </>
                ) : (
                  <p className={readonlyCls} dir="ltr">{customer.emailAddress}</p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-slate-700" />

          {/* Address */}
          <section className="space-y-3">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">כתובת האתר</p>

            <div className="space-y-1">
              <label className="text-slate-400 text-xs">כתובת *</label>
              {editing ? (
                <input value={form.siteAddress} onChange={e => set('siteAddress', e.target.value)}
                       onBlur={() => touch('siteAddress')}
                       className={inputCls('siteAddress', form.siteAddress, true)} />
              ) : (
                <p className={readonlyCls}>{customer.siteAddress}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-xs">עיר *</label>
              {editing ? (
                <CitySelect label="" value={form.siteCity} onChange={v => set('siteCity', v)}
                            required touched={!!touched.siteCity} onBlur={() => touch('siteCity')} />
              ) : (
                <p className={readonlyCls}>{customer.siteCity}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">קומה</label>
                {editing ? (
                  <input value={form.siteFloor} type="number" onChange={e => set('siteFloor', e.target.value)}
                         onBlur={() => touch('siteFloor')}
                         className={inputCls('siteFloor', form.siteFloor)} />
                ) : (
                  <p className={readonlyCls}>{customer.siteFloor ?? '—'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">דירה</label>
                {editing ? (
                  <input value={form.siteApt} onChange={e => set('siteApt', e.target.value)}
                         onBlur={() => touch('siteApt')}
                         className={inputCls('siteApt', form.siteApt)} />
                ) : (
                  <p className={readonlyCls}>{customer.siteApt ?? '—'}</p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-slate-700" />

          {/* Architect */}
          <section className="space-y-3">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">אדריכל / מעצב</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">שם אדריכל</label>
                {editing ? (
                  <input value={form.architectName} onChange={e => set('architectName', e.target.value)}
                         onBlur={() => touch('architectName')}
                         className={inputCls('architectName', form.architectName)} />
                ) : (
                  <p className={readonlyCls}>{customer.architectName ?? '—'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">טלפון אדריכל</label>
                {editing ? (
                  <>
                    <input value={form.architectPhone} dir="ltr" type="tel" inputMode="numeric"
                           maxLength={10} pattern={PHONE_PATTERN} title={PHONE_TITLE_HE}
                           onChange={e => set('architectPhone', sanitizePhoneInput(e.target.value))}
                           onBlur={() => touch('architectPhone')}
                           className={inputCls('architectPhone', form.architectPhone, false, phoneError(form.architectPhone))} />
                    {touched.architectPhone && phoneError(form.architectPhone) && (
                      <p className="text-red-400 text-xs">{phoneError(form.architectPhone)}</p>
                    )}
                  </>
                ) : (
                  <p className={readonlyCls} dir="ltr">{customer.architectPhone ?? '—'}</p>
                )}
              </div>
            </div>
          </section>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          {editing ? (
            <div className="flex gap-3 pt-2">
              <button onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300
                           hover:bg-slate-800 text-sm transition-colors">
                ביטול
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500
                           text-white font-medium text-sm disabled:opacity-50 transition-colors">
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300
                           hover:bg-slate-800 text-sm transition-colors">
                סגור
              </button>
              <button onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600
                           text-white font-medium text-sm transition-colors">
                ✏ ערוך פרטים
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
