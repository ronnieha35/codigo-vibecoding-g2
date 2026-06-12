import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { useProductList, useProductDetail, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/lib/hooks/useProducts'

const BASE = 'http://localhost:8000/api/v1'
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Widget', sku: 'WGT-001', category: 'General', unit_price: 9.99, stock_quantity: 100, is_active: true }] }
const mockDetail = { id: 1, supplier_id: 10, warehouse_id: null, name: 'Widget', sku: 'WGT-001', description: 'A widget', category: 'General', unit_price: 9.99, weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3, stock_quantity: 100, is_active: true, supplier: { id: 10, name: 'ACME' }, warehouse: null, created_at: '2024-01-01', updated_at: '2024-01-01' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => { localStorage.clear() })

describe('useProductList', () => {
  it('resolves with product list', async () => {
    server.use(http.get(`${BASE}/products/`, () => HttpResponse.json(mockList)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useProductList(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].sku).toBe('WGT-001')
    qc.clear()
  })
})

describe('useProductDetail', () => {
  it('fetches product by id', async () => {
    server.use(http.get(`${BASE}/products/1/`, () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useProductDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.stock_quantity).toBe(100)
    qc.clear()
  })

  it('disabled when id is null', () => {
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useProductDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    qc.clear()
  })
})

describe('useCreateProduct', () => {
  it('invalidates products queryKey on success', async () => {
    server.use(http.post(`${BASE}/products/`, async () => HttpResponse.json(mockDetail, { status: 201 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateProduct(), { wrapper })
    const payload = { supplier_id: 10, warehouse_id: null, name: 'Widget', sku: 'WGT-001', description: 'desc', category: 'General', unit_price: 9.99, weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3, stock_quantity: 100, is_active: true }
    await act(async () => { await result.current.mutateAsync(payload) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] })
    qc.clear()
  })
})

describe('useUpdateProduct', () => {
  it('invalidates products queryKey on success', async () => {
    server.use(http.patch(`${BASE}/products/1/`, async () => HttpResponse.json(mockDetail)))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProduct(), { wrapper })
    const patch = { supplier_id: 10, warehouse_id: null, name: 'Widget', sku: 'WGT-001', description: 'desc', category: 'General', unit_price: 9.99, weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3, stock_quantity: 200, is_active: true }
    await act(async () => { await result.current.mutateAsync({ id: 1, data: patch }) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] })
    qc.clear()
  })
})

describe('useDeleteProduct', () => {
  it('invalidates products queryKey on success', async () => {
    server.use(http.delete(`${BASE}/products/1/`, () => new HttpResponse(null, { status: 204 })))
    const { qc, wrapper } = makeWrapper()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteProduct(), { wrapper })
    await act(async () => { await result.current.mutateAsync(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] })
    qc.clear()
  })
})
