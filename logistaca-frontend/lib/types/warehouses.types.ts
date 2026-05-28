export interface WarehouseList {
  id: number
  name: string
  city: string
  country: string
  is_active: boolean
}

export interface WarehouseDetail {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone: string
  capacity_m3: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseWrite {
  name: string
  address: string
  city: string
  country: string
  phone: string
  capacity_m3: number
  is_active: boolean
}
