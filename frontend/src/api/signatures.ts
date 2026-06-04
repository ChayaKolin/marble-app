import axios from 'axios'

export type SignatureCategory =
  | 'PRE_MEASUREMENT_DISCLAIMER'
  | 'SLAB_LAYOUT_APPROVAL'
  | 'FINAL_POST_INSTALLATION'

export interface SignatureResponse {
  id: string
  orderId: string
  category: SignatureCategory
  ipAddress: string | null
  signedAt: string
}

export async function submitSignature(
  orderId: string,
  category: SignatureCategory,
  signatureData: string,
): Promise<SignatureResponse> {
  const { data } = await axios.post<SignatureResponse>(
    `/api/v1/orders/${orderId}/signatures`,
    { category, signatureData },
  )
  return data
}
