import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useWarehouseList, useWarehouseDetail, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/lib/hooks/useWarehouses'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Bodega Norte', city: 'Bogotá', country: 'CO', is_active: true }] }
const mockDetail = { id: 1, name: 'Bodega Norte', address: 'Calle 1', city: 'Bogotá', country: 'CO', phone: '3001', capacity_m3: 500, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useWarehouseList', () => {
  it('starts pending then succeeds', async () => {
    server.use(http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useWarehouseList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
    qc.clear()
  })
})

describe('useWarehouseDetail', () => {
  it('fetches warehouse detail by id', async () => {
    server.use(http.get(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useWarehouseDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.capacity_m3).toBe(500)
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useWarehouseDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateWarehouse', () => {
  it('invalidates warehouses on success', async () => {
    server.use(http.post(`${BASE}/warehouses/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper })
    const payload = { name: 'Bodega Norte', address: 'Calle 1', city: 'Bogotá', country: 'CO', phone: '3001', capacity_m3: 500, is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] })
    qc.clear()
  })
})

describe('useUpdateWarehouse', () => {
  it('invalidates warehouses on success', async () => {
    server.use(http.patch(`${BASE}/warehouses/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateWarehouse(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { capacity_m3: 1000 } }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] })
    qc.clear()
  })
})

describe('useDeleteWarehouse', () => {
  it('invalidates warehouses on success', async () => {
    server.use(http.delete(`${BASE}/warehouses/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses'] })
    qc.clear()
  })
})
