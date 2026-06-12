import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { shipmentsApi } from '@/lib/api/shipments.api'

const BASE = 'http://localhost:8000/api/v1'

const mockShipment = {
  id: 1, customer_id: 2, origin_warehouse_id: 5, driver_id: null, transport_id: null, route_id: null,
  destination_address: 'Cra 1 #2-3', destination_city: 'Bogotá', destination_country: 'CO',
  status: 'PENDING' as const, scheduled_date: '2024-06-01', delivered_at: null,
  shipping_cost: 100, total_weight_kg: 10, notes: '',
  customer: { id: 2, name: 'Carlos' }, origin_warehouse: { id: 5, name: 'Bodega Norte', city: 'Bogotá' },
  driver: null, transport: null, route: null, items: [], status_history: [],
  created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, customer: { id: 2, name: 'Carlos' }, status: 'PENDING' as const, scheduled_date: '2024-06-01', destination_city: 'Bogotá', destination_country: 'CO', shipping_cost: 100, created_at: '2024-01-01' }] }

beforeEach(() => { localStorage.clear() })

describe('shipmentsApi.list', () => {
  it('sends page and page_size', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/shipments/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await shipmentsApi.list()
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })

  it('passes filters as query params', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/shipments/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await shipmentsApi.list(1, 20, { status: 'PENDING', search: 'carlos' })
    expect(params.status).toBe('PENDING')
    expect(params.search).toBe('carlos')
  })
})

describe('shipmentsApi.get', () => {
  it('fetches shipment detail', async () => {
    server.use(http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment)))
    const res = await shipmentsApi.get(1)
    expect(res.data.status).toBe('PENDING')
    expect(res.data.items).toHaveLength(0)
  })
})

describe('shipmentsApi.create', () => {
  it('transforms customer_id→customer, maps items', async () => {
    let body: Record<string, unknown> = {}
    server.use(http.post(`${BASE}/shipments/`, async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(mockShipment, { status: 201 })
    }))
    const payload = {
      customer_id: 2, origin_warehouse_id: 5, destination_address: 'Cra 1',
      destination_city: 'Bogotá', destination_country: 'CO', scheduled_date: '2024-06-01',
      shipping_cost: 100, total_weight_kg: 10,
      items: [{ product_id: 10, quantity: 2, unit_price: 50 }],
    }
    await shipmentsApi.create(payload)
    // toBackendPayload maps ids
    expect(body.customer).toBe(2)
    expect(body.origin_warehouse).toBe(5)
    expect(body.customer_id).toBeUndefined()
    const items = body.items as Array<Record<string, unknown>>
    expect(items[0].product).toBe(10)
    expect(items[0].product_id).toBeUndefined()
  })
})

describe('shipmentsApi.update', () => {
  it('sends PATCH to /shipments/{id}/', async () => {
    let method = ''
    server.use(http.patch(`${BASE}/shipments/1/`, async ({ request }) => {
      method = request.method
      return HttpResponse.json({ ...mockShipment, status: 'ASSIGNED' })
    }))
    const patch = {
      customer_id: 2, origin_warehouse_id: 5, destination_address: 'Cra 1',
      destination_city: 'Bogotá', destination_country: 'CO', scheduled_date: '2024-06-01',
      shipping_cost: 100, total_weight_kg: 10, status: 'ASSIGNED' as const, items: [],
    }
    const res = await shipmentsApi.update(1, patch)
    expect(method).toBe('PATCH')
    expect(res.data.status).toBe('ASSIGNED')
  })
})

describe('shipmentsApi.delete', () => {
  it('sends DELETE /shipments/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/shipments/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await shipmentsApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404', async () => {
    server.use(http.get(`${BASE}/shipments/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(shipmentsApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
