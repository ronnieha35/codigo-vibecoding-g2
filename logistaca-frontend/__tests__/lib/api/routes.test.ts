import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { routesApi } from '@/lib/api/routes.api'

const BASE = 'http://localhost:8000/api/v1'

const mockRoute = {
  id: 1, name: 'Ruta Norte', origin_warehouse_id: 5, description: 'Ruta principal',
  estimated_duration_hours: 3.5, is_active: true,
  origin_warehouse: { id: 5, name: 'Bodega Norte' },
  stops: [], created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Ruta Norte', origin_warehouse: { id: 5, name: 'Bodega Norte' }, estimated_duration_hours: 3.5, is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('routesApi.list', () => {
  it('sends page and page_size', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/routes/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await routesApi.list()
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })
})

describe('routesApi.get', () => {
  it('fetches route detail', async () => {
    server.use(http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute)))
    const res = await routesApi.get(1)
    expect(res.data.estimated_duration_hours).toBe(3.5)
  })
})

describe('routesApi.create', () => {
  it('transforms origin_warehouse_id→origin_warehouse and maps stops', async () => {
    let body: Record<string, unknown> = {}
    server.use(http.post(`${BASE}/routes/`, async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(mockRoute, { status: 201 })
    }))
    const payload = {
      name: 'Ruta Norte', origin_warehouse_id: 5, description: 'Ruta principal',
      estimated_duration_hours: 3.5, is_active: true,
      stops: [{ warehouse_id: 6, stop_order: 1, estimated_duration_minutes: 30 }],
    }
    await routesApi.create(payload)
    // toBackendPayload maps origin_warehouse_id → origin_warehouse
    expect(body.origin_warehouse).toBe(5)
    expect(body.origin_warehouse_id).toBeUndefined()
    // stops map warehouse_id → warehouse
    const stops = body.stops as Array<Record<string, unknown>>
    expect(stops[0].warehouse).toBe(6)
    expect(stops[0].warehouse_id).toBeUndefined()
    expect(stops[0].stop_order).toBe(1)
  })
})

describe('routesApi.update', () => {
  it('sends PATCH with transformed payload', async () => {
    let method = ''
    server.use(http.patch(`${BASE}/routes/1/`, async ({ request }) => {
      method = request.method
      return HttpResponse.json(mockRoute)
    }))
    const patch = {
      name: 'Ruta Norte', origin_warehouse_id: 5, description: 'Updated',
      estimated_duration_hours: 4, is_active: true, stops: [],
    }
    await routesApi.update(1, patch)
    expect(method).toBe('PATCH')
  })
})

describe('routesApi.delete', () => {
  it('sends DELETE /routes/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/routes/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await routesApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404', async () => {
    server.use(http.get(`${BASE}/routes/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(routesApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
