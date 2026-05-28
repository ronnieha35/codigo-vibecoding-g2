'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driversApi } from '@/lib/api/drivers.api'
import type { DriverWrite } from '@/lib/types/drivers.types'

const QUERY_KEY = 'drivers'

export function useDriverList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => driversApi.list(page).then((r) => r.data),
  })
}

export function useDriverDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => driversApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DriverWrite) => driversApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DriverWrite> }) =>
      driversApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => driversApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
