import axios from 'axios'

export type OrderStatus =
  | 'QUOTATION'
  | 'CLOSED_AWAITING_MEASUREMENT'
  | 'REVIEWING_LAYOUT'
  | 'PRODUCTION'
  | 'AWAITING_INSTALLATION'
  | 'PENDING_REPAIR'
  | 'COMPLETED'
  | 'ARCHIVED'

export const ORDER_STATUS_HE: Record<OrderStatus, string> = {
  QUOTATION: 'הצעת מחיר',
  CLOSED_AWAITING_MEASUREMENT: 'סגירה ומחכה למדידה',
  REVIEWING_LAYOUT: 'לעבור על התוכנית',
  PRODUCTION: 'ייצור',
  AWAITING_INSTALLATION: 'מחכה להתקנה',
  PENDING_REPAIR: 'מחכה לתיקון',
  COMPLETED: 'מושלם',
  ARCHIVED: 'ארכיון',
}

export interface OrderResponse {
  id: string
  customerId: string
  customerFullName: string
  customerPhone: string
  customerEmail: string
  status: OrderStatus
  effectiveAddress: string
  effectiveCity: string
  effectiveFloor: number | null
  effectiveApt: string | null
  overrideAddress: string | null
  overrideCity: string | null
  totalGrossAmount: number | null
  craneRequired: boolean
  factorySlaDeadline: string | null
  notes: string | null
  measurementPaymentTotal: number | null
  measurementPaymentToConsultant: number | null
  measurementPaymentToMeasurer: number | null
  layoutDocumentUrl: string | null
  measurementsDocumentUrl: string | null
  createdAt: string
  deletedAt: string | null
}

export async function fetchActiveOrders(): Promise<OrderResponse[]> {
  const { data } = await axios.get<OrderResponse[]>('/api/v1/orders')
  return data
}

export async function fetchOrderById(id: string): Promise<OrderResponse> {
  const { data } = await axios.get<OrderResponse>(`/api/v1/orders/${id}`)
  return data
}

export async function fetchDeletedOrders(): Promise<OrderResponse[]> {
  const { data } = await axios.get<OrderResponse[]>('/api/v1/orders/trash')
  return data
}

export async function restoreOrder(id: string): Promise<OrderResponse> {
  const { data } = await axios.patch<OrderResponse>(`/api/v1/orders/${id}/restore`)
  return data
}

/** Soft-delete an order. Allowed until the customer digitally approves the slab layout. Reason is optional. */
export async function deleteOrder(id: string, reason?: string): Promise<void> {
  await axios.delete(`/api/v1/orders/${id}`, { data: { reason: reason?.trim() || null } })
}
