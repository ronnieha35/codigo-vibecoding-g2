import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useSupplierList, useSupplierDetail, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/lib/hooks/useSuppliers'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'ACME', email: 'a@test.com', tax_id: '900', is_active: true }] }
const mockDetail = { id: 1, name: 'ACME', email: 'a@test.com', phone: '123', address: 'St 1', city: 'Bogotá', country: 'CO', tax_id: '900', contact_name: 'Ana', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  }
}

beforeEach(() => { localStorage.clear() })

describe('useSupplierList', () => {
  it('starts as pending then resolves with paginated data', async () => {
    server.use(http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSupplierList(1), { wrapper })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe('ACME')
    qc.clear()
  })

  it('uses queryKey [suppliers, page, search]', async () => {
    server.use(http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    renderHook(() => useSupplierList(2, 'test'), { wrapper })
    await waitFor(() => qc.getQueryState(['suppliers', 2, 'test']) !== undefined)
    expect(qc.getQueryState(['suppliers', 2, 'test'])).toBeDefined()
    qc.clear()
  })
})

describe('useSupplierDetail', () => {
  it('fetches supplier by id', async () => {
    server.use(http.get(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSupplierDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('ACME')
    qc.clear()
  })

  it('is disabled when id is null', async () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSupplierDetail(null), { wrapper })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateSupplier', () => {
  it('posts and invalidates suppliers queryKey', async () => {
    server.use(http.post(`${BASE}/suppliers/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateSupplier(), { wrapper })
    const payload = { name: 'ACME', email: 'a@test.com', phone: '123', address: 'St 1', city: 'Bogotá', country: 'CO', tax_id: '900', contact_name: 'Ana', is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] })
    qc.clear()
  })
})

describe('useUpdateSupplier', () => {
  it('patches and invalidates suppliers queryKey', async () => {
    server.use(http.patch(`${BASE}/suppliers/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { name: 'Updated' } }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] })
    qc.clear()
  })
})

describe('useDeleteSupplier', () => {
  it('deletes and invalidates suppliers queryKey', async () => {
    server.use(http.delete(`${BASE}/suppliers/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers'] })
    qc.clear()
  })
})
