import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { driversApi } from '@/lib/api/drivers.api'

const BASE = 'http://localhost:8000/api/v1'

const mockDriver = {
  id: 1, first_name: 'Juan', last_name: 'Pérez', transport_id: null,
  license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true,
  transport: null, created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, first_name: 'Juan', last_name: 'Pérez', license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('driversApi.list', () => {
  it('sends page and page_size', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/drivers/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await driversApi.list()
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })

  it('passes search when provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/drivers/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await driversApi.list(1, 20, 'juan')
    expect(params.search).toBe('juan')
  })
})

describe('driversApi.get', () => {
  it('fetches driver by id', async () => {
    server.use(http.get(`${BASE}/drivers/1/`, () => HttpResponse.json(mockDriver)))
    const res = await driversApi.get(1)
    expect(res.data.license_number).toBe('LIC-001')
  })
})

describe('driversApi.create', () => {
  it('posts driver payload', async () => {
    let body: unknown
    server.use(http.post(`${BASE}/drivers/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(mockDriver, { status: 201 })
    }))
    const payload = { first_name: 'Juan', last_name: 'Pérez', license_number: 'LIC-001', phone: '3001', is_available: true, is_active: true }
    await driversApi.create(payload)
    expect(body).toMatchObject({ first_name: 'Juan', license_number: 'LIC-001' })
  })
})

describe('driversApi.update', () => {
  it('patches driver', async () => {
    server.use(http.patch(`${BASE}/drivers/1/`, async () => HttpResponse.json({ ...mockDriver, is_available: false })))
    const res = await driversApi.update(1, { is_available: false })
    expect(res.data.is_available).toBe(false)
  })
})

describe('driversApi.delete', () => {
  it('sends DELETE /drivers/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/drivers/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await driversApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404', async () => {
    server.use(http.get(`${BASE}/drivers/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(driversApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
