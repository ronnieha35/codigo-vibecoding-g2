'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '@/lib/api/suppliers.api'
import type { SupplierWrite } from '@/lib/types/suppliers.types'

const QUERY_KEY = 'suppliers'

export function useSupplierList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => suppliersApi.list(page).then((r) => r.data),
  })
}

export function useSupplierDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => suppliersApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SupplierWrite) => suppliersApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierWrite> }) =>
      suppliersApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
