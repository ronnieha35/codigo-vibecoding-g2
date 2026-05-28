import type { VehicleType } from './transport.types'

export interface DriverList {
  id: number
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
}

export interface DriverDetail {
  id: number
  user_id: number
  transport_id: number | null
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
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
  user_id: number
  transport_id?: number | null
  license_number: string
  phone: string
  is_available: boolean
  is_active: boolean
}
