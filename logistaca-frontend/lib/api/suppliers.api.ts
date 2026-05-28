import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { SupplierList, SupplierDetail, SupplierWrite } from '@/lib/types/suppliers.types'

export const suppliersApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<SupplierList>>('/suppliers/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<SupplierDetail>(`/suppliers/${id}/`),

  create: (data: SupplierWrite) =>
    apiClient.post<SupplierDetail>('/suppliers/', data),

  update: (id: number, data: Partial<SupplierWrite>) =>
    apiClient.patch<SupplierDetail>(`/suppliers/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/suppliers/${id}/`),
}
