import type { VehicleType } from './transport.types'

export type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

export interface ShipmentItemWrite {
  product_id: number
  quantity: number
  unit_price: number
}

export interface ShipmentItemDetail {
  id: number
  product: { id: number; name: string; sku: string }
  quantity: number
  unit_price: number
}

export interface ShipmentStatusHistory {
  id: number
  status: ShipmentStatus
  changed_at: string
  changed_by: { id: number; username: string } | null
  notes: string
}

export interface ShipmentList {
  id: number
  customer: { id: number; name: string }
  status: ShipmentStatus
  scheduled_date: string
  destination_city: string
  destination_country: string
  shipping_cost: number
  created_at: string
}

export interface ShipmentDetail {
  id: number
  customer_id: number
  origin_warehouse_id: number
  driver_id: number | null
  transport_id: number | null
  route_id: number | null
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  scheduled_date: string
  delivered_at: string | null
  shipping_cost: number
  total_weight_kg: number
  notes: string
  customer: { id: number; name: string }
  origin_warehouse: { id: number; name: string; city: string }
  driver: { id: number; license_number: string } | null
  transport: { id: number; name: string; license_plate: string; vehicle_type: VehicleType } | null
  route: { id: number; name: string } | null
  items: ShipmentItemDetail[]
  status_history: ShipmentStatusHistory[]
  created_at: string
  updated_at: string
}

export interface ShipmentWrite {
  customer_id: number
  origin_warehouse_id: number
  driver_id?: number | null
  transport_id?: number | null
  route_id?: number | null
  destination_address: string
  destination_city: string
  destination_country: string
  status?: ShipmentStatus
  scheduled_date: string
  shipping_cost: number
  total_weight_kg: number
  notes?: string
  items: ShipmentItemWrite[]
}
