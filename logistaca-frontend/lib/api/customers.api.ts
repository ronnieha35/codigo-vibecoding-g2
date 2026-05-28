import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { CustomerList, CustomerDetail, CustomerWrite } from '@/lib/types/customers.types'

export const customersApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<CustomerList>>('/customers/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<CustomerDetail>(`/customers/${id}/`),

  create: (data: CustomerWrite) =>
    apiClient.post<CustomerDetail>('/customers/', data),

  update: (id: number, data: Partial<CustomerWrite>) =>
    apiClient.patch<CustomerDetail>(`/customers/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/customers/${id}/`),
}
