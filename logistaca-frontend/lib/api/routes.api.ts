import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { RouteList, RouteDetail, RouteWrite } from '@/lib/types/routes.types'

export const routesApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<RouteList>>('/routes/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<RouteDetail>(`/routes/${id}/`),

  create: (data: RouteWrite) =>
    apiClient.post<RouteDetail>('/routes/', data),

  update: (id: number, data: Partial<RouteWrite>) =>
    apiClient.patch<RouteDetail>(`/routes/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/routes/${id}/`),
}
