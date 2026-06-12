import type { VehicleType } from './transport.types'

export interface DriverList {
  id: number
  first_name: string
  last_name: string
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
}

export interface DriverDetail {
  id: number
  first_name: string
  last_name: string
  transport_id: number | null
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
  transport: {
    id: number
    name: string
    license_plate: string
    vehicle_type: VehicleType
  } | null
  created_at: string
  updated_at: string
}

export interface DriverWrite {
  first_name: string
  last_name: string
  transport_id?: number | null
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
}
