import axios from 'axios'

export interface MonthlyRevenue {
  month: number
  monthHe: string
  grossAmount: number
  collected: number
}

export interface MaterialVolume {
  modelCode: string
  squareMeters: number
}

export interface SlaComplianceEntry {
  orderRef: string
  customerName: string
  slaDealine: string
  metSla: boolean
}

export interface InstallerPerformance {
  installerName: string
  completedJobs: number
  jobsWithNotes: number
}

export interface AnalyticsDashboardResponse {
  totalRevenueThisMonth: number
  totalCollectedThisMonth: number
  totalReceivablesPipeline: number
  openProductionBacklog: number
  monthlyRevenue: MonthlyRevenue[]
  materialDistribution: MaterialVolume[]
  slaCompliance: SlaComplianceEntry[]
  installerPerformance: InstallerPerformance[]
}

export async function fetchDashboard(): Promise<AnalyticsDashboardResponse> {
  const { data } = await axios.get<AnalyticsDashboardResponse>('/api/v1/analytics/dashboard')
  return data
}

export function formatNis(amount: number) {
  return '₪' + amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
