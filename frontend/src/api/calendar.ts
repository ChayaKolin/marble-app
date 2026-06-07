import axios from 'axios'
import type { OrderStatus } from './orders'

export type CalendarEventType = 'INSTALLATION' | 'PREP_TASK' | 'MEASUREMENT' | 'SITE_VISIT'

export const EVENT_TYPE_HE: Record<CalendarEventType, string> = {
  INSTALLATION: 'התקנה',
  PREP_TASK:    'משימת הכנה',
  MEASUREMENT:  'מדידה',
  SITE_VISIT:   'ביקור חוזר',
}

export const EVENT_TYPE_COLOR: Record<CalendarEventType, string> = {
  INSTALLATION: 'bg-emerald-500',
  PREP_TASK:    'bg-amber-500',
  MEASUREMENT:  'bg-blue-500',
  SITE_VISIT:   'bg-purple-500',
}

export interface CalendarEventResponse {
  id: string
  title: string
  eventType: CalendarEventType
  relatedOrderId: string | null
  customerName: string | null
  effectiveAddress: string | null
  effectiveCity: string | null
  effectiveFloor: number | null
  effectiveApt: string | null
  elevatorNotes: string | null
  orderStatus: OrderStatus | null
  assignedToUserId: string | null
  assignedToUserName: string | null
  measurerId: string | null
  measurerName: string | null
  measurerPhone: string | null
  eventDate: string        // YYYY-MM-DD
  startTime: string | null // HH:mm:ss
  endTime: string | null
  notes: string | null
  // Financial — null for non-Consultant
  totalGrossAmount: number | null
  orderNotes: string | null
}

export interface CreateCalendarEventRequest {
  title: string
  eventType: CalendarEventType
  relatedOrderId?: string
  assignedToUserId?: string
  measurerId?: string
  eventDate: string
  startTime?: string
  endTime?: string
  notes?: string
}

export async function fetchCalendarEvents(): Promise<CalendarEventResponse[]> {
  const { data } = await axios.get<CalendarEventResponse[]>('/api/v1/calendar/events')
  return data
}

export async function createCalendarEvent(req: CreateCalendarEventRequest): Promise<CalendarEventResponse> {
  const { data } = await axios.post<CalendarEventResponse>('/api/v1/calendar/events', req)
  return data
}

export async function updateCalendarEvent(id: string, req: CreateCalendarEventRequest): Promise<CalendarEventResponse> {
  const { data } = await axios.put<CalendarEventResponse>(`/api/v1/calendar/events/${id}`, req)
  return data
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await axios.delete(`/api/v1/calendar/events/${id}`)
}

/** Group events by date string (YYYY-MM-DD). */
export function groupByDate(events: CalendarEventResponse[]): Record<string, CalendarEventResponse[]> {
  return events.reduce<Record<string, CalendarEventResponse[]>>((acc, e) => {
    ;(acc[e.eventDate] ??= []).push(e)
    return acc
  }, {})
}
