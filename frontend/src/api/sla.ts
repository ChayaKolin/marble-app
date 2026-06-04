import axios from 'axios'
import type { OrderResponse } from './orders'

export async function fetchProductionOrders(): Promise<OrderResponse[]> {
  const { data } = await axios.get<OrderResponse[]>('/api/v1/orders')
  return data.filter(o => o.status === 'PRODUCTION')
}

/** Hours remaining until SLA deadline. Negative = overdue. */
export function hoursUntilDeadline(factorySlaDeadline: string | null): number | null {
  if (!factorySlaDeadline) return null
  const ms = new Date(factorySlaDeadline).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60))
}

export type SlaUrgency = 'green' | 'yellow' | 'red'

export function slaUrgency(hours: number | null): SlaUrgency {
  if (hours === null) return 'green'
  if (hours < 0) return 'red'       // overdue
  if (hours < 24) return 'red'      // < 1 day
  if (hours < 48) return 'yellow'   // 1–2 days
  return 'green'
}
