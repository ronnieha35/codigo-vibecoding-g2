import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { TransportList, TransportDetail, TransportWrite } from '@/lib/types/transport.types'

export const transportApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<TransportList>>('/transport/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<TransportDetail>(`/transport/${id}/`),

  create: (data: TransportWrite) =>
    apiClient.post<TransportDetail>('/transport/', data),

  update: (id: number, data: Partial<TransportWrite>) =>
    apiClient.patch<TransportDetail>(`/transport/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/transport/${id}/`),
}
