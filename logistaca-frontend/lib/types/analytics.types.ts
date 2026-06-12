export type Granularity = 'day' | 'week' | 'month'

export interface TopDestination {
  destination_city: string
  destination_country: string
  count: number
}

export interface DriverShipmentCount {
  driver_id: number
  driver_name: string
  count: number
}

export interface TimelinePoint {
  period: string
  count: number
  revenue: number
  weight: number
}

export interface DashboardKPIs {
  active_shipments: number
  monthly_revenue: number
  delivery_rate: number
  low_stock_count: number
}

export interface StatusCount {
  status: string
  label: string
  count: number
}

export interface DashboardSummary {
  kpis: DashboardKPIs
  by_status: StatusCount[]
}
