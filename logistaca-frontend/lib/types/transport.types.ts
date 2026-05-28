export type VehicleType = 'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'OTHER'

export interface TransportList {
  id: number
  name: string
  license_plate: string
  vehicle_type: VehicleType
  is_available: boolean
  is_active: boolean
}

export interface TransportDetail {
  id: number
  name: string
  license_plate: string
  vehicle_type: VehicleType
  capacity_kg: number
  capacity_m3: number
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TransportWrite {
  name: string
  license_plate: string
  vehicle_type: VehicleType
  capacity_kg: number
  capacity_m3: number
  is_available: boolean
  is_active: boolean
}
