'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transportApi } from '@/lib/api/transport.api'
import type { TransportWrite } from '@/lib/types/transport.types'

const QUERY_KEY = 'transport'

export function useTransportList(page: number, search?: string, vehicleType?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, page, search, vehicleType],
    queryFn: () => transportApi.list(page, 20, search, vehicleType).then((r) => r.data),
  })
}

export function useTransportDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => transportApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TransportWrite) => transportApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransportWrite> }) =>
      transportApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => transportApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
