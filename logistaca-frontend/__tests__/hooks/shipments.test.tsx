import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useShipmentList, useShipmentDetail, useCreateShipment, useUpdateShipment, useDeleteShipment } from '@/lib/hooks/useShipments'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, customer: { id: 2, name: 'Carlos' }, status: 'PENDING' as const, scheduled_date: '2024-06-01', destination_city: 'Bogotá', destination_country: 'CO', shipping_cost: 100, created_at: '2024-01-01' }] }
const mockDetail = { id: 1, customer_id: 2, origin_warehouse_id: 5, driver_id: null, transport_id: null, route_id: null, destination_address: 'Cra 1', destination_city: 'Bogotá', destination_country: 'CO', status: 'PENDING' as const, scheduled_date: '2024-06-01', delivered_at: null, shipping_cost: 100, total_weight_kg: 10, notes: '', customer: { id: 2, name: 'Carlos' }, origin_warehouse: { id: 5, name: 'Bodega Norte', city: 'Bogotá' }, driver: null, transport: null, route: null, items: [], status_history: [], created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useShipmentList', () => {
  it('resolves with shipment list', async () => {
    server.use(http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useShipmentList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].status).toBe('PENDING')
    qc.clear()
  })

  it('includes filters in queryKey', async () => {
    server.use(http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const filters = { status: 'PENDING' as const }
    renderHook(() => useShipmentList(1, filters), { wrapper })
    await waitFor(() => qc.getQueryState(['shipments', 1, filters]) !== undefined)
    expect(qc.getQueryState(['shipments', 1, filters])).toBeDefined()
    qc.clear()
  })
})

describe('useShipmentDetail', () => {
  it('fetches shipment by id', async () => {
    server.use(http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useShipmentDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(0)
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useShipmentDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateShipment', () => {
  it('invalidates shipments queryKey', async () => {
    server.use(http.post(`${BASE}/shipments/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateShipment(), { wrapper })
    const payload = { customer_id: 2, origin_warehouse_id: 5, destination_address: 'Cra 1', destination_city: 'Bogotá', destination_country: 'CO', scheduled_date: '2024-06-01', shipping_cost: 100, total_weight_kg: 10, items: [{ product_id: 10, quantity: 1, unit_price: 50 }] }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    qc.clear()
  })
})

describe('useUpdateShipment', () => {
  it('invalidates shipments queryKey', async () => {
    server.use(http.patch(`${BASE}/shipments/1/`, async () => HttpResponse.json({ ...mockDetail, status: 'ASSIGNED' })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateShipment(), { wrapper })
    const patch = { customer_id: 2, origin_warehouse_id: 5, destination_address: 'Cra 1', destination_city: 'Bogotá', destination_country: 'CO', scheduled_date: '2024-06-01', shipping_cost: 100, total_weight_kg: 10, status: 'ASSIGNED' as const, items: [] }
    await act(async () => { await result.current.mutateAsync({ id: 1, data: patch }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    qc.clear()
  })
})

describe('useDeleteShipment', () => {
  it('invalidates shipments queryKey', async () => {
    server.use(http.delete(`${BASE}/shipments/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteShipment(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    qc.clear()
  })
})
