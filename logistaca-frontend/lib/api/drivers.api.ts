import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { DriverList, DriverDetail, DriverWrite } from '@/lib/types/drivers.types'

export const driversApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<DriverList>>('/drivers/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<DriverDetail>(`/drivers/${id}/`),

  create: (data: DriverWrite) =>
    apiClient.post<DriverDetail>('/drivers/', data),

  update: (id: number, data: Partial<DriverWrite>) =>
    apiClient.patch<DriverDetail>(`/drivers/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/drivers/${id}/`),
}
