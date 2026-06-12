import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useRouteList, useRouteDetail, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/lib/hooks/useRoutes'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Ruta Norte', origin_warehouse: { id: 5, name: 'Bodega Norte' }, estimated_duration_hours: 3.5, is_active: true }] }
const mockDetail = { id: 1, name: 'Ruta Norte', origin_warehouse_id: 5, description: 'desc', estimated_duration_hours: 3.5, is_active: true, origin_warehouse: { id: 5, name: 'Bodega Norte' }, stops: [], created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useRouteList', () => {
  it('resolves with route list', async () => {
    server.use(http.get(`${BASE}/routes/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useRouteList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe('Ruta Norte')
    qc.clear()
  })
})

describe('useRouteDetail', () => {
  it('fetches route by id', async () => {
    server.use(http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useRouteDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.estimated_duration_hours).toBe(3.5)
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useRouteDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateRoute', () => {
  it('invalidates routes queryKey', async () => {
    server.use(http.post(`${BASE}/routes/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateRoute(), { wrapper })
    const payload = { name: 'Ruta Norte', origin_warehouse_id: 5, description: 'desc', estimated_duration_hours: 3.5, is_active: true, stops: [] }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] })
    qc.clear()
  })
})

describe('useUpdateRoute', () => {
  it('invalidates routes queryKey', async () => {
    server.use(http.patch(`${BASE}/routes/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateRoute(), { wrapper })
    const patch = { name: 'Updated', origin_warehouse_id: 5, description: 'desc', estimated_duration_hours: 4, is_active: true, stops: [] }
    await act(async () => { await result.current.mutateAsync({ id: 1, data: patch }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] })
    qc.clear()
  })
})

describe('useDeleteRoute', () => {
  it('invalidates routes queryKey', async () => {
    server.use(http.delete(`${BASE}/routes/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteRoute(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['routes'] })
    qc.clear()
  })
})
