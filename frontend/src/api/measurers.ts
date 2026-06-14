import axios from 'axios'

export interface MeasurerResponse {
  id: string
  firstName: string
  lastName: string | null
  phoneNumber: string
}

export interface CreateMeasurerRequest {
  firstName: string
  lastName: string
  phoneNumber: string
}

export async function fetchMeasurers(): Promise<MeasurerResponse[]> {
  const { data } = await axios.get<MeasurerResponse[]>('/api/v1/measurers')
  return data
}

export async function createMeasurer(req: CreateMeasurerRequest): Promise<MeasurerResponse> {
  const { data } = await axios.post<MeasurerResponse>('/api/v1/measurers', req)
  return data
}
