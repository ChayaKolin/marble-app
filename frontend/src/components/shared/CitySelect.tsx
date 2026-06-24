import { useEffect, useState } from 'react'
import { ISRAELI_CITIES } from '../../lib/constants'

interface Props {
  label: string
  value: string
  onChange: (city: string) => void
  required?: boolean
  small?: boolean
  touched?: boolean
  onBlur?: () => void
}

const MAX_RESULTS = 40

export default function CitySelect({ label, value, onChange, required, small, touched, onBlur }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  useEffect(() => { setQuery(value) }, [value])

  const trimmed = query.trim()
  const allMatches = trimmed ? ISRAELI_CITIES.filter(c => c.includes(trimmed)) : ISRAELI_CITIES
  const matches = allMatches.slice(0, MAX_RESULTS)

  function pick(city: string) {
    onChange(city)
    setQuery(city)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight(h => Math.min(h + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && matches[highlight]) pick(matches[highlight]) }
    else if (e.key === 'Escape') { setOpen(false); setQuery(value) }
  }

  function handleBlur() {
    setOpen(false)
    setQuery(value)
    onBlur?.()
  }

  const labelCls = small ? 'text-slate-500 text-xs' : 'text-slate-400 text-xs'

  const baseCls = 'w-full bg-slate-800 rounded-lg px-3 text-slate-100 text-sm focus:outline-none placeholder:text-slate-600 transition-colors'
  const sizeCls = small ? 'py-1.5' : 'py-2'
  const borderCls = !touched
    ? 'border border-slate-600 focus:border-emerald-500'
    : value.trim()
    ? 'border border-emerald-500 focus:border-emerald-500'
    : required
    ? 'border border-red-500 focus:border-red-500'
    : 'border border-slate-600 focus:border-emerald-500'

  return (
    <div className="space-y-1 relative">
      <label className={labelCls}>{label}</label>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        required={required}
        placeholder="הקלד לחיפוש עיר..."
        autoComplete="off"
        className={`${baseCls} ${sizeCls} ${borderCls}`}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          {matches.length ? matches.map((city, i) => (
            <button
              type="button"
              key={city}
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(city)}
              onMouseEnter={() => setHighlight(i)}
              className={`block w-full text-right px-3 py-1.5 text-sm transition-colors
                          ${i === highlight ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-200 hover:bg-slate-700'}`}
            >
              {city}
            </button>
          )) : (
            <p className="px-3 py-2 text-xs text-slate-500">לא נמצאו ערים תואמות לחיפוש</p>
          )}
          {allMatches.length > MAX_RESULTS && (
            <p className="px-3 py-1.5 text-xs text-slate-600 border-t border-slate-700">
              מוצגות {MAX_RESULTS} התוצאות הראשונות מתוך {allMatches.length} — המשיכי להקליד כדי לצמצם
            </p>
          )}
        </div>
      )}
    </div>
  )
}
