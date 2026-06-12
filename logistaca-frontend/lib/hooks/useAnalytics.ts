'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/analytics.api'
import type { Granularity } from '@/lib/types/analytics.types'

const QUERY_KEY = 'analytics'

export function useDashboardSummary(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, 'dashboard', params],
    queryFn: () => analyticsApi.dashboard(params).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useTopDestinations(params?: { date_from?: string; date_to?: string; country?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, 'top-destinations', params],
    queryFn: () => analyticsApi.topDestinations(params).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useShipmentsByDriver(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, 'by-driver', params],
    queryFn: () => analyticsApi.byDriver(params).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useShipmentTimeline(params?: {
  date_from?: string
  date_to?: string
  granularity?: Granularity
  driver_id?: number
}) {
  return useQuery({
    queryKey: [QUERY_KEY, 'timeline', params],
    queryFn: () => analyticsApi.timeline(params).then((r) => r.data),
    staleTime: 60_000,
  })
}
