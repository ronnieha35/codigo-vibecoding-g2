import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { ShipmentList, ShipmentDetail, ShipmentWrite } from '@/lib/types/shipments.types'

export const shipmentsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<ShipmentList>>('/shipments/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<ShipmentDetail>(`/shipments/${id}/`),

  create: (data: ShipmentWrite) =>
    apiClient.post<ShipmentDetail>('/shipments/', data),

  update: (id: number, data: Partial<ShipmentWrite>) =>
    apiClient.patch<ShipmentDetail>(`/shipments/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/shipments/${id}/`),
}
