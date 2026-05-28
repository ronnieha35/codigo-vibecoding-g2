import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { ProductList, ProductDetail, ProductWrite } from '@/lib/types/products.types'

export const productsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<ProductList>>('/products/', { params: { page, page_size: pageSize } }),

  get: (id: number) =>
    apiClient.get<ProductDetail>(`/products/${id}/`),

  create: (data: ProductWrite) =>
    apiClient.post<ProductDetail>('/products/', data),

  update: (id: number, data: Partial<ProductWrite>) =>
    apiClient.patch<ProductDetail>(`/products/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/products/${id}/`),
}
