import axios from 'axios'

export type ActivityAction = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'ORDER_DELETED' | 'ORDER_RESTORED'

export const ACTIVITY_ACTION_HE: Record<ActivityAction, string> = {
  ORDER_CREATED: 'הזמנה נוצרה',
  ORDER_STATUS_CHANGED: 'סטטוס הזמנה עודכן',
  ORDER_DELETED: 'הזמנה נמחקה',
  ORDER_RESTORED: 'הזמנה שוחזרה',
}

export interface ActivityLogEntry {
  id: string
  entityType: string
  entityId: string
  action: ActivityAction
  performedByName: string | null
  customerName: string | null
  description: string | null
  reason: string | null
  createdAt: string
}

export async function fetchActivityLog(): Promise<ActivityLogEntry[]> {
  const { data } = await axios.get<ActivityLogEntry[]>('/api/v1/activity-log')
  return data
}
