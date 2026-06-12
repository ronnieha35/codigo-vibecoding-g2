import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { transportApi } from '@/lib/api/transport.api'

const BASE = 'http://localhost:8000/api/v1'

const mockTransport = {
  id: 1, name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const,
  capacity_kg: 5000, capacity_m3: 20, is_available: true, is_active: true,
  created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const, is_available: true, is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('transportApi.list', () => {
  it('sends default page params', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/transport/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await transportApi.list()
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })

  it('passes vehicle_type filter when provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/transport/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await transportApi.list(1, 20, undefined, 'TRUCK')
    expect(params.vehicle_type).toBe('TRUCK')
  })

  it('omits vehicle_type when not provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/transport/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await transportApi.list()
    expect(params.vehicle_type).toBeUndefined()
  })
})

describe('transportApi.get', () => {
  it('fetches single transport', async () => {
    server.use(http.get(`${BASE}/transport/1/`, () => HttpResponse.json(mockTransport)))
    const res = await transportApi.get(1)
    expect(res.data.vehicle_type).toBe('TRUCK')
    expect(res.data.capacity_kg).toBe(5000)
  })
})

describe('transportApi.create', () => {
  it('posts to /transport/ with payload', async () => {
    let body: unknown
    server.use(http.post(`${BASE}/transport/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(mockTransport, { status: 201 })
    }))
    const payload = { name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const, capacity_kg: 5000, capacity_m3: 20, is_available: true, is_active: true }
    await transportApi.create(payload)
    expect(body).toMatchObject({ vehicle_type: 'TRUCK', capacity_kg: 5000 })
  })
})

describe('transportApi.update', () => {
  it('sends PATCH /transport/{id}/', async () => {
    server.use(http.patch(`${BASE}/transport/1/`, async () => HttpResponse.json({ ...mockTransport, is_available: false })))
    const res = await transportApi.update(1, { is_available: false })
    expect(res.data.is_available).toBe(false)
  })
})

describe('transportApi.delete', () => {
  it('sends DELETE /transport/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/transport/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await transportApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404', async () => {
    server.use(http.get(`${BASE}/transport/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(transportApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
