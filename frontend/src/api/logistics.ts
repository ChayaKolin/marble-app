import axios from 'axios'

export async function markLogisticsComplete(orderId: string, assignmentId: string): Promise<void> {
  await axios.patch(`/api/v1/orders/${orderId}/logistics/${assignmentId}/complete`)
}
