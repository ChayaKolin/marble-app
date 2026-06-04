import axios from 'axios'

export interface CustomerResponse {
  id: string
  fullName: string
  phoneNumber: string
  emailAddress: string
  siteAddress: string
  siteCity: string
  siteFloor: number | null
  siteApt: string | null
  architectName: string | null
  architectPhone: string | null
  createdAt: string
  deletedAt: string | null
}

export async function fetchActiveCustomers(): Promise<CustomerResponse[]> {
  const { data } = await axios.get<CustomerResponse[]>('/api/v1/customers')
  return data
}

export async function fetchDeletedCustomers(): Promise<CustomerResponse[]> {
  const { data } = await axios.get<CustomerResponse[]>('/api/v1/customers/trash')
  return data
}

export async function restoreCustomer(id: string): Promise<CustomerResponse> {
  const { data } = await axios.patch<CustomerResponse>(`/api/v1/customers/${id}/restore`)
  return data
}
