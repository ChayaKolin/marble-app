import axios from 'axios'
import type { OrderStatus } from './orders'

export interface PaymentMilestoneStatus {
  tier: number
  labelHe: string
  amount: number
  cleared: boolean
}

export interface PortalMaterialSpec {
  marbleModelCode: string
  finishType: string
  squareMeters: number
  counterEdgeDetailing: string | null
  waterEdgeRequired: boolean
  cooktopBaseFee: number
  notes: string | null
}

export interface PortalSinkSpec {
  brand: string
  modelName: string
  widthMm: number
  heightMm: number
  depthMm: number
  color: string
  mountingStyle: 'UNDERMOUNT' | 'FLUSH_MOUNT'
  quantity: number
  notes: string | null
}

export interface PortalOrderResponse {
  id: string
  status: OrderStatus
  statusHe: string
  effectiveAddress: string
  effectiveCity: string
  effectiveFloor: number | null
  effectiveApt: string | null
  layoutDocumentUrl: string | null
  measurementsDocumentUrl: string | null
  measurementDisclaimerSigned: boolean
  layoutApprovalSigned: boolean
  finalInstallationSigned: boolean
  paymentMilestones: PaymentMilestoneStatus[]
  createdAt: string
  materialSpecs: PortalMaterialSpec[]
  sinkSpecs: PortalSinkSpec[]
}

export async function fetchPortalOrders(): Promise<PortalOrderResponse[]> {
  const { data } = await axios.get<PortalOrderResponse[]>('/api/v1/portal/orders')
  return data
}

export async function fetchPortalOrder(orderId: string): Promise<PortalOrderResponse> {
  const { data } = await axios.get<PortalOrderResponse>(`/api/v1/portal/orders/${orderId}`)
  return data
}
