import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { warehousesApi } from '@/lib/api/warehouses.api'

const BASE = 'http://localhost:8000/api/v1'

const mockWarehouse = {
  id: 1, name: 'Bodega Norte', address: 'Calle 1', city: 'Bogotá', country: 'CO',
  phone: '3001', capacity_m3: 500, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Bodega Norte', city: 'Bogotá', country: 'CO', is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('warehousesApi.list', () => {
  it('sends page and page_size by default', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/warehouses/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    const res = await warehousesApi.list()
    expect(res.data.count).toBe(1)
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })

  it('passes search when provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/warehouses/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await warehousesApi.list(1, 20, 'norte')
    expect(params.search).toBe('norte')
  })
})

describe('warehousesApi.get', () => {
  it('fetches single warehouse by id', async () => {
    server.use(http.get(`${BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse)))
    const res = await warehousesApi.get(1)
    expect(res.data.capacity_m3).toBe(500)
  })
})

describe('warehousesApi.create', () => {
  it('posts to /warehouses/ and returns created resource', async () => {
    let body: unknown
    server.use(http.post(`${BASE}/warehouses/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(mockWarehouse, { status: 201 })
    }))
    const payload = { name: 'Bodega Norte', address: 'Calle 1', city: 'Bogotá', country: 'CO', phone: '3001', capacity_m3: 500, is_active: true }
    const res = await warehousesApi.create(payload)
    expect(res.data.id).toBe(1)
    expect(body).toMatchObject({ capacity_m3: 500 })
  })
})

describe('warehousesApi.update', () => {
  it('patches /warehouses/{id}/', async () => {
    server.use(http.patch(`${BASE}/warehouses/1/`, async () => HttpResponse.json({ ...mockWarehouse, capacity_m3: 1000 })))
    const res = await warehousesApi.update(1, { capacity_m3: 1000 })
    expect(res.data.capacity_m3).toBe(1000)
  })
})

describe('warehousesApi.delete', () => {
  it('sends DELETE /warehouses/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/warehouses/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await warehousesApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404 when not found', async () => {
    server.use(http.get(`${BASE}/warehouses/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(warehousesApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
