import apiClient from './client'
import type { DashboardSummary, DriverShipmentCount, Granularity, TimelinePoint, TopDestination } from '@/lib/types/analytics.types'

export const analyticsApi = {
  dashboard: (params?: { date_from?: string; date_to?: string }) =>
    apiClient.get<DashboardSummary>('/analytics/dashboard/', { params }),

  timeline: (params?: { date_from?: string; date_to?: string; granularity?: Granularity; driver_id?: number }) =>
    apiClient.get<TimelinePoint[]>('/analytics/shipments/timeline/', { params }),

  topDestinations: (params?: { date_from?: string; date_to?: string; country?: string; limit?: number }) =>
    apiClient.get<TopDestination[]>('/analytics/shipments/top-destinations/', { params }),

  byDriver: (params?: { date_from?: string; date_to?: string }) =>
    apiClient.get<DriverShipmentCount[]>('/analytics/shipments/by-driver/', { params }),
}
