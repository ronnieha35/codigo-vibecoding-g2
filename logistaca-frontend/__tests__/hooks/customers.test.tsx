import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useCustomerList, useCustomerDetail, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/lib/hooks/useCustomers'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Carlos', customer_type: 'PERSON' as const, email: 'c@test.com', city: 'Bogotá', is_active: true }] }
const mockDetail = { id: 1, user_id: null, name: 'Carlos', customer_type: 'PERSON' as const, email: 'c@test.com', phone: '3001', address: 'Cra 1', city: 'Bogotá', country: 'CO', tax_id: null, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useCustomerList', () => {
  it('resolves with customer list', async () => {
    server.use(http.get(`${BASE}/customers/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].customer_type).toBe('PERSON')
    qc.clear()
  })

  it('passes customerType filter in queryKey', async () => {
    server.use(http.get(`${BASE}/customers/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    renderHook(() => useCustomerList(1, undefined, 'COMPANY'), { wrapper })
    await waitFor(() => qc.getQueryState(['customers', 1, undefined, 'COMPANY']) !== undefined)
    expect(qc.getQueryState(['customers', 1, undefined, 'COMPANY'])).toBeDefined()
    qc.clear()
  })
})

describe('useCustomerDetail', () => {
  it('fetches customer by id', async () => {
    server.use(http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.email).toBe('c@test.com')
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateCustomer', () => {
  it('invalidates customers queryKey', async () => {
    server.use(http.post(`${BASE}/customers/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCustomer(), { wrapper })
    const payload = { name: 'Carlos', customer_type: 'PERSON' as const, email: 'c@test.com', phone: '3001', address: 'Cra 1', city: 'Bogotá', country: 'CO', is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] })
    qc.clear()
  })
})

describe('useUpdateCustomer', () => {
  it('invalidates customers queryKey', async () => {
    server.use(http.patch(`${BASE}/customers/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCustomer(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { city: 'Medellín' } }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] })
    qc.clear()
  })
})

describe('useDeleteCustomer', () => {
  it('invalidates customers queryKey', async () => {
    server.use(http.delete(`${BASE}/customers/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCustomer(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['customers'] })
    qc.clear()
  })
})
