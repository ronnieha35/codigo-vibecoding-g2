import apiClient from './client'
import type { PaginatedResponse } from '@/lib/types/api.types'
import type { ShipmentList, ShipmentDetail, ShipmentWrite, ShipmentStatus } from '@/lib/types/shipments.types'

export interface ShipmentFilters {
  status?: ShipmentStatus
  search?: string
  date_from?: string
  date_to?: string
  customer_id?: number
  warehouse_id?: number
  product_id?: number
}

function toBackendPayload(data: ShipmentWrite) {
  return {
    customer: data.customer_id,
    origin_warehouse: data.origin_warehouse_id,
    driver: data.driver_id ?? null,
    transport: data.transport_id ?? null,
    route: data.route_id ?? null,
    destination_address: data.destination_address,
    destination_city: data.destination_city,
    destination_country: data.destination_country,
    status: data.status,
    scheduled_date: data.scheduled_date,
    shipping_cost: data.shipping_cost,
    total_weight_kg: data.total_weight_kg,
    notes: data.notes,
    items: data.items?.map((i) => ({
      product: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
  }
}

export const shipmentsApi = {
  list: (page = 1, pageSize = 20, filters?: ShipmentFilters) =>
    apiClient.get<PaginatedResponse<ShipmentList>>('/shipments/', {
      params: { page, page_size: pageSize, ...filters },
    }),

  get: (id: number) =>
    apiClient.get<ShipmentDetail>(`/shipments/${id}/`),

  create: (data: ShipmentWrite) =>
    apiClient.post<ShipmentDetail>('/shipments/', toBackendPayload(data)),

  update: (id: number, data: Partial<ShipmentWrite>) =>
    apiClient.patch<ShipmentDetail>(`/shipments/${id}/`, toBackendPayload(data as ShipmentWrite)),

  delete: (id: number) =>
    apiClient.delete(`/shipments/${id}/`),
}
