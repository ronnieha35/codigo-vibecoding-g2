'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehousesApi } from '@/lib/api/warehouses.api'
import type { WarehouseWrite } from '@/lib/types/warehouses.types'

const QUERY_KEY = 'warehouses'

export function useWarehouseList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => warehousesApi.list(page).then((r) => r.data),
  })
}

export function useWarehouseDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => warehousesApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WarehouseWrite) => warehousesApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WarehouseWrite> }) =>
      warehousesApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehousesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
