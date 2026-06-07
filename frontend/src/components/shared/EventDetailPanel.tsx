import type { CalendarEventResponse } from '../../api/calendar'
import { EVENT_TYPE_HE } from '../../api/calendar'
import { ORDER_STATUS_HE } from '../../api/orders'

interface Props {
  event: CalendarEventResponse
  isConsultant: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function EventDetailPanel({ event, isConsultant, onClose, onEdit, onDelete }: Props) {
  return (
    <div className="fixed inset-y-0 start-0 w-80 max-w-full bg-slate-900 border-e border-slate-700
                    shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
        <h3 className="text-slate-100 font-semibold text-sm truncate">{event.title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Event type + date */}
        <div className="space-y-1">
          <span className="text-xs text-slate-500">סוג אירוע</span>
          <p className="text-slate-200 text-sm">{EVENT_TYPE_HE[event.eventType]}</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-500">תאריך ושעה</span>
          <p className="text-slate-200 text-sm">
            {new Date(event.eventDate).toLocaleDateString('he-IL')}
            {event.startTime && ` · ${event.startTime.slice(0, 5)}`}
            {event.endTime && `–${event.endTime.slice(0, 5)}`}
          </p>
        </div>

        {/* Customer + address — always visible */}
        {event.customerName && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">לקוח</span>
            <p className="text-slate-200 text-sm">{event.customerName}</p>
          </div>
        )}

        {event.effectiveAddress && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">כתובת</span>
            <p className="text-slate-200 text-sm">
              {event.effectiveAddress}, {event.effectiveCity}
              {event.effectiveFloor != null && ` · קומה ${event.effectiveFloor}`}
              {event.effectiveApt && ` · דירה ${event.effectiveApt}`}
            </p>
          </div>
        )}

        {event.elevatorNotes && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">גישה</span>
            <p className="text-slate-400 text-xs">{event.elevatorNotes}</p>
          </div>
        )}

        {/* Order status — always visible */}
        {event.orderStatus && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">סטטוס הזמנה</span>
            <p className="text-slate-200 text-sm">{ORDER_STATUS_HE[event.orderStatus]}</p>
          </div>
        )}

        {/* Assigned installer */}
        {event.assignedToUserName && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">מתקין</span>
            <p className="text-slate-200 text-sm">{event.assignedToUserName}</p>
          </div>
        )}

        {/* Measurer — booked from the roster, e.g. for MEASUREMENT events */}
        {event.measurerName && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">מודד</span>
            <p className="text-slate-200 text-sm">
              {event.measurerName}
              {event.measurerPhone && <span className="text-slate-400 text-xs" dir="ltr"> · {event.measurerPhone}</span>}
            </p>
          </div>
        )}

        {event.notes && (
          <div className="space-y-1">
            <span className="text-xs text-slate-500">הערות</span>
            <p className="text-slate-300 text-sm">{event.notes}</p>
          </div>
        )}

        {/* Financial — Consultant only */}
        {isConsultant && event.totalGrossAmount != null && (
          <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-700">
            <p className="text-xs text-slate-500 font-medium">פיננסי (יועץ בלבד)</p>
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">סכום כולל</span>
              <span className="text-emerald-300 text-sm font-medium">
                ₪{event.totalGrossAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {event.orderNotes && (
              <p className="text-slate-400 text-xs">{event.orderNotes}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions — only when editable */}
      {isConsultant && (onEdit || onDelete) && (
        <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 py-2 rounded-lg text-sm bg-slate-700 text-slate-200
                         hover:bg-slate-600 transition-colors"
            >
              עריכה
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 py-2 rounded-lg text-sm bg-red-900/40 text-red-300
                         hover:bg-red-900/70 transition-colors"
            >
              מחיקה
            </button>
          )}
        </div>
      )}
    </div>
  )
}
