import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { RouteList, RouteDetail, RouteWrite } from '@/lib/types/routes.types'

function toBackendPayload(data: RouteWrite) {
  return {
    name: data.name,
    origin_warehouse: data.origin_warehouse_id,
    description: data.description,
    estimated_duration_hours: data.estimated_duration_hours,
    is_active: data.is_active,
    stops: data.stops?.map((s) => ({
      warehouse: s.warehouse_id,
      stop_order: s.stop_order,
      estimated_duration_minutes: s.estimated_duration_minutes,
    })),
  }
}

export const routesApi = {
  list: (page = 1, pageSize = 20, search?: string) =>
    apiClient.get<PaginatedResponse<RouteList>>('/routes/', { params: { page, page_size: pageSize, ...(search ? { search } : {}) } }),

  get: (id: number) =>
    apiClient.get<RouteDetail>(`/routes/${id}/`),

  create: (data: RouteWrite) =>
    apiClient.post<RouteDetail>('/routes/', toBackendPayload(data)),

  update: (id: number, data: Partial<RouteWrite>) =>
    apiClient.patch<RouteDetail>(`/routes/${id}/`, toBackendPayload(data as RouteWrite)),

  delete: (id: number) =>
    apiClient.delete(`/routes/${id}/`),
}
