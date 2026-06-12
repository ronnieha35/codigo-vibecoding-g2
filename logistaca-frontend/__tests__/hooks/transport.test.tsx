import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useTransportList, useTransportDetail, useCreateTransport, useUpdateTransport, useDeleteTransport } from '@/lib/hooks/useTransport'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const, is_available: true, is_active: true }] }
const mockDetail = { id: 1, name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const, capacity_kg: 5000, capacity_m3: 20, is_available: true, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useTransportList', () => {
  it('resolves with transport list', async () => {
    server.use(http.get(`${BASE}/transport/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransportList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].vehicle_type).toBe('TRUCK')
    qc.clear()
  })

  it('includes vehicleType in queryKey', async () => {
    server.use(http.get(`${BASE}/transport/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    renderHook(() => useTransportList(1, undefined, 'VAN'), { wrapper })
    await waitFor(() => qc.getQueryState(['transport', 1, undefined, 'VAN']) !== undefined)
    expect(qc.getQueryState(['transport', 1, undefined, 'VAN'])).toBeDefined()
    qc.clear()
  })
})

describe('useTransportDetail', () => {
  it('fetches transport by id', async () => {
    server.use(http.get(`${BASE}/transport/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransportDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.capacity_kg).toBe(5000)
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransportDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateTransport', () => {
  it('invalidates transport queryKey', async () => {
    server.use(http.post(`${BASE}/transport/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateTransport(), { wrapper })
    const payload = { name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const, capacity_kg: 5000, capacity_m3: 20, is_available: true, is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['transport'] })
    qc.clear()
  })
})

describe('useUpdateTransport', () => {
  it('invalidates transport queryKey', async () => {
    server.use(http.patch(`${BASE}/transport/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateTransport(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { is_available: false } }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['transport'] })
    qc.clear()
  })
})

describe('useDeleteTransport', () => {
  it('invalidates transport queryKey', async () => {
    server.use(http.delete(`${BASE}/transport/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteTransport(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['transport'] })
    qc.clear()
  })
})
