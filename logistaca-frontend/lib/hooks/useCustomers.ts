'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api/customers.api'
import type { CustomerWrite } from '@/lib/types/customers.types'

const QUERY_KEY = 'customers'

export function useCustomerList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => customersApi.list(page).then((r) => r.data),
  })
}

export function useCustomerDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => customersApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomerWrite) => customersApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerWrite> }) =>
      customersApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
