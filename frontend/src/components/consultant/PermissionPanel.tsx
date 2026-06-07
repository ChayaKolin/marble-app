import { useEffect, useState } from 'react'
import {
  type FeatureKey,
  type UserPermissionsResponse,
  fetchUserPermissions,
  updatePermission,
} from '../../api/permissions'

interface FeatureMeta {
  key: FeatureKey
  labelHe: string
  descriptionHe: string
}

const FEATURES: FeatureMeta[] = [
  {
    key: 'VIEW_ANALYTICS',
    labelHe: 'צפייה בנתוני הכנסות',
    descriptionHe: 'גישה לדשבורד עם סכומי הכנסות חודשיים',
  },
  {
    key: 'VIEW_FINANCIAL_CHARTS',
    labelHe: 'צפייה בגרפים פיננסיים',
    descriptionHe: 'גרפי מעקב תזרים וצפי הכנסות',
  },
  {
    key: 'MANAGE_CALENDAR',
    labelHe: 'ניהול לוח שנה (יצירה/עריכה)',
    descriptionHe: 'יצירה, עריכה ומחיקה של אירועים בלוח השנה',
  },
  {
    key: 'VIEW_INSTALLER_RATINGS',
    labelHe: 'צפייה בדירוגי מתקינים',
    descriptionHe: 'נתוני ביצועים ודגלי איכות לכל מתקין',
  },
  {
    key: 'EXPORT_REPORTS',
    labelHe: 'ייצוא דוחות',
    descriptionHe: 'הורדת דוחות עסקיים לקובץ',
  },
]

interface Props {
  hotmanUserId: string
}

export default function PermissionPanel({ hotmanUserId }: Props) {
  const [permissions, setPermissions] = useState<Record<FeatureKey, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<FeatureKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserPermissions(hotmanUserId)
      .then((res: UserPermissionsResponse) => setPermissions(res.permissions))
      .catch(() => setError('שגיאה בטעינת הרשאות'))
      .finally(() => setLoading(false))
  }, [hotmanUserId])

  async function handleToggle(feature: FeatureKey, currentValue: boolean) {
    if (toggling) return
    setToggling(feature)
    try {
      const result = await updatePermission(hotmanUserId, feature, !currentValue)
      setPermissions(prev => prev ? { ...prev, [feature]: result.granted } : prev)
    } catch {
      setError('שגיאה בעדכון הרשאה')
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-4">טוען הרשאות...</div>
  }

  if (error) {
    return <div className="text-red-400 text-sm py-4">{error}</div>
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
      <h3 className="text-slate-100 font-semibold text-base mb-1">הרשאות מנהל מפעל</h3>
      <p className="text-slate-400 text-xs mb-4">
        גישה לצפייה בלוח השנה ו-SLA תמיד פעילה — אינה ניתנת לכיבוי
      </p>

      <div className="divide-y divide-slate-800">
        {FEATURES.map(({ key, labelHe, descriptionHe }) => {
          const granted = permissions?.[key] ?? false
          const isToggling = toggling === key

          return (
            <div key={key} className="flex items-center justify-between py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium">{labelHe}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{descriptionHe}</p>
              </div>

              <button
                role="switch"
                aria-checked={granted}
                aria-label={labelHe}
                disabled={isToggling}
                onClick={() => handleToggle(key, granted)}
                className={[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2',
                  'border-transparent transition-colors duration-200 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                  'disabled:opacity-50 disabled:cursor-wait',
                  granted ? 'bg-emerald-500' : 'bg-slate-700',
                ].join(' ')}
              >
                <span
                  className={[
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
                    'transform transition duration-200 ease-in-out',
                    // The thumb's rest position already sits at the track's main-start (right edge in RTL,
                    // left edge in LTR) — translateX is a physical transform, so only the "granted" (moved)
                    // state needs an offset, mirrored via rtl: for the opposite physical direction.
                    granted ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
