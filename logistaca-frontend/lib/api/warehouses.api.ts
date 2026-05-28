import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { WarehouseList, WarehouseDetail, WarehouseWrite } from '@/lib/types/warehouses.types'

export const warehousesApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<WarehouseList>>('/warehouses/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<WarehouseDetail>(`/warehouses/${id}/`),

  create: (data: WarehouseWrite) =>
    apiClient.post<WarehouseDetail>('/warehouses/', data),

  update: (id: number, data: Partial<WarehouseWrite>) =>
    apiClient.patch<WarehouseDetail>(`/warehouses/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/warehouses/${id}/`),
}
