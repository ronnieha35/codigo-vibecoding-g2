import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { ProductList, ProductDetail, ProductWrite } from '@/lib/types/products.types'

function toBackendPayload(data: ProductWrite) {
  return {
    supplier: data.supplier_id,
    warehouse: data.warehouse_id ?? null,
    name: data.name,
    sku: data.sku,
    description: data.description,
    category: data.category,
    unit_price: data.unit_price,
    weight_kg: data.weight_kg,
    length_cm: data.length_cm,
    width_cm: data.width_cm,
    height_cm: data.height_cm,
    stock_quantity: data.stock_quantity,
    is_active: data.is_active,
  }
}

export const productsApi = {
  list: (page = 1, pageSize = 20, search?: string) =>
    apiClient.get<PaginatedResponse<ProductList>>('/products/', { params: { page, page_size: pageSize, ...(search ? { search } : {}) } }),

  get: (id: number) =>
    apiClient.get<ProductDetail>(`/products/${id}/`),

  create: (data: ProductWrite) =>
    apiClient.post<ProductDetail>('/products/', toBackendPayload(data)),

  update: (id: number, data: Partial<ProductWrite>) =>
    apiClient.patch<ProductDetail>(`/products/${id}/`, toBackendPayload(data as ProductWrite)),

  delete: (id: number) =>
    apiClient.delete(`/products/${id}/`),
}
