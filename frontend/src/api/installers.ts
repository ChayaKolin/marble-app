import axios from 'axios'

export interface InstallerResponse {
  id: string
  fullName: string
  phoneNumber: string
}

export interface CreateInstallerRequest {
  firstName: string
  lastName: string
  phoneNumber: string
}

export async function fetchInstallers(): Promise<InstallerResponse[]> {
  const { data } = await axios.get<InstallerResponse[]>('/api/v1/auth/users/installers')
  return data
}

export async function createInstaller(req: CreateInstallerRequest): Promise<InstallerResponse> {
  const { data } = await axios.post<InstallerResponse>('/api/v1/auth/users/installers', req)
  return data
}
