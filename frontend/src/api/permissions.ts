import axios from 'axios'

export type FeatureKey =
  | 'VIEW_ANALYTICS'
  | 'VIEW_FINANCIAL_CHARTS'
  | 'MANAGE_CALENDAR'
  | 'VIEW_INSTALLER_RATINGS'
  | 'EXPORT_REPORTS'

export interface UserPermissionsResponse {
  userId: string
  fullName: string
  permissions: Record<FeatureKey, boolean>
}

export interface PermissionUpdateResponse {
  userId: string
  feature: FeatureKey
  granted: boolean
  grantedAt: string
}

export async function fetchUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  const { data } = await axios.get<UserPermissionsResponse>(`/api/v1/admin/permissions/${userId}`)
  return data
}

export async function updatePermission(
  userId: string,
  feature: FeatureKey,
  granted: boolean,
): Promise<PermissionUpdateResponse> {
  const { data } = await axios.put<PermissionUpdateResponse>(
    `/api/v1/admin/permissions/${userId}`,
    { feature, granted },
  )
  return data
}
