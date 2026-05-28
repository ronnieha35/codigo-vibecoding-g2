export interface RouteStopWrite {
  warehouse_id: number
  stop_order: number
  estimated_duration_minutes: number
}

export interface RouteStopDetail {
  id: number
  warehouse: { id: number; name: string }
  stop_order: number
  estimated_duration_minutes: number
}

export interface RouteList {
  id: number
  name: string
  origin_warehouse: { id: number; name: string }
  estimated_duration_hours: number
  is_active: boolean
}

export interface RouteDetail {
  id: number
  name: string
  origin_warehouse_id: number
  description: string
  estimated_duration_hours: number
  is_active: boolean
  origin_warehouse: { id: number; name: string }
  stops: RouteStopDetail[]
  created_at: string
  updated_at: string
}

export interface RouteWrite {
  name: string
  origin_warehouse_id: number
  description: string
  estimated_duration_hours: number
  is_active: boolean
  stops: RouteStopWrite[]
}
