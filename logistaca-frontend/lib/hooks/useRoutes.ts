'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routesApi } from '@/lib/api/routes.api'
import type { RouteWrite } from '@/lib/types/routes.types'

const QUERY_KEY = 'routes'

export function useRouteList(page: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page],
    queryFn: () => routesApi.list(page).then((r) => r.data),
  })
}

export function useRouteDetail(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => routesApi.get(id!).then((r) => r.data),
    enabled: id !== null,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RouteWrite) => routesApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RouteWrite> }) =>
      routesApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => routesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
