/**
 * Shared Hebrew formatters.
 * date format: DD/MM/YYYY (Israeli standard)
 * currency: ₪ prefix, comma thousands separator
 * week starts: Sunday (Israeli standard — used in all calendar views)
 */

/** DD/MM/YYYY */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** DD/MM/YYYY HH:mm */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** ₪1,234.56 */
export function formatNis(amount: number): string {
  return '₪' + amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** ₪1,234 (no decimals, for KPI headers) */
export function formatNisCompact(amount: number): string {
  return '₪' + amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/** Returns the locale week start day for Israel (Sunday = 0). */
export const WEEK_START_SUNDAY = 0

/**
 * RTL Tailwind directional utility reference (for developers).
 * In RTL layouts:
 *   ps- (padding-inline-start) = padding-right in LTR → padding-left in RTL
 *   pe- (padding-inline-end)   = padding-left  in LTR → padding-right in RTL
 *   ms- / me-  = margin equivalents
 *
 * Prefer logical properties over directional:
 *   ✓ ps-4, pe-4, ms-4, me-4
 *   ✗ pl-4, pr-4, ml-4, mr-4  (unless absolutely needed with rtl: variant)
 *
 * For icons that should flip in RTL:
 *   <span className="flip-x">→</span>  (see index.css .flip-x rule)
 */
export const RTL_GUIDE = null  // documentation only — not used at runtime
