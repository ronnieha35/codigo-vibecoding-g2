import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useDriverList, useDriverDetail, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/lib/hooks/useDrivers'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, first_name: 'Juan', last_name: 'Pérez', license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true }] }
const mockDetail = { id: 1, first_name: 'Juan', last_name: 'Pérez', transport_id: null, license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true, transport: null, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useDriverList', () => {
  it('resolves with driver list', async () => {
    server.use(http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useDriverList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].license_number).toBe('LIC-001')
    qc.clear()
  })
})

describe('useDriverDetail', () => {
  it('fetches driver by id', async () => {
    server.use(http.get(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useDriverDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.first_name).toBe('Juan')
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useDriverDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateDriver', () => {
  it('invalidates drivers queryKey', async () => {
    server.use(http.post(`${BASE}/drivers/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateDriver(), { wrapper })
    const payload = { first_name: 'Juan', last_name: 'Pérez', license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] })
    qc.clear()
  })
})

describe('useUpdateDriver', () => {
  it('invalidates drivers queryKey', async () => {
    server.use(http.patch(`${BASE}/drivers/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateDriver(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { is_available: false } }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] })
    qc.clear()
  })
})

describe('useDeleteDriver', () => {
  it('invalidates drivers queryKey', async () => {
    server.use(http.delete(`${BASE}/drivers/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteDriver(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers'] })
    qc.clear()
  })
})
