'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsApi } from '@/lib/api/shipments.api'
import type { ShipmentWrite } from '@/lib/types/shipments.types'

const QUERY_KEY = 'shipments'

export function useShipmentList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => shipmentsApi.list(page).then((r) => r.data),
  })
}

export function useShipmentDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => shipmentsApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentWrite) => shipmentsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShipmentWrite> }) =>
      shipmentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
