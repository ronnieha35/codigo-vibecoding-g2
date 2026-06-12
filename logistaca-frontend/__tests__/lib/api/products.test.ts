import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { productsApi } from '@/lib/api/products.api'

const BASE = 'http://localhost:8000/api/v1'

const mockProduct = {
  id: 1, supplier_id: 10, warehouse_id: null, name: 'Widget', sku: 'WGT-001',
  description: 'A widget', category: 'General', unit_price: 9.99,
  weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3,
  stock_quantity: 100, is_active: true,
  supplier: { id: 10, name: 'ACME' }, warehouse: null,
  created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Widget', sku: 'WGT-001', category: 'General', unit_price: 9.99, stock_quantity: 100, is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('productsApi.list', () => {
  it('sends correct default params', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/products/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    const res = await productsApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })
})

describe('productsApi.get', () => {
  it('fetches product detail by id', async () => {
    server.use(http.get(`${BASE}/products/1/`, () => HttpResponse.json(mockProduct)))
    const res = await productsApi.get(1)
    expect(res.data.sku).toBe('WGT-001')
  })
})

describe('productsApi.create', () => {
  it('transforms supplier_id→supplier and warehouse_id→warehouse in request body', async () => {
    let body: Record<string, unknown> = {}
    server.use(http.post(`${BASE}/products/`, async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(mockProduct, { status: 201 })
    }))
    const payload = {
      supplier_id: 10, warehouse_id: null, name: 'Widget', sku: 'WGT-001',
      description: 'A widget', category: 'General', unit_price: 9.99,
      weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3,
      stock_quantity: 100, is_active: true,
    }
    await productsApi.create(payload)
    // toBackendPayload maps supplier_id → supplier, warehouse_id → warehouse
    expect(body.supplier).toBe(10)
    expect(body.warehouse).toBeNull()
    expect((body as Record<string, unknown>).supplier_id).toBeUndefined()
  })
})

describe('productsApi.update', () => {
  it('sends PATCH with transformed payload', async () => {
    let method = ''
    let body: Record<string, unknown> = {}
    server.use(http.patch(`${BASE}/products/1/`, async ({ request }) => {
      method = request.method
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(mockProduct)
    }))
    const patch = {
      supplier_id: 10, warehouse_id: null, name: 'Widget Updated', sku: 'WGT-001',
      description: 'desc', category: 'General', unit_price: 9.99,
      weight_kg: 0.5, length_cm: 10, width_cm: 5, height_cm: 3,
      stock_quantity: 100, is_active: true,
    }
    await productsApi.update(1, patch)
    expect(method).toBe('PATCH')
    expect(body.name).toBe('Widget Updated')
  })
})

describe('productsApi.delete', () => {
  it('sends DELETE /products/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/products/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await productsApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 422 on validation error', async () => {
    server.use(http.post(`${BASE}/products/`, () => HttpResponse.json({ detail: 'Invalid' }, { status: 422 })))
    await expect(productsApi.create({} as never)).rejects.toMatchObject({ response: { status: 422 } })
  })
})
