import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { customersApi } from '@/lib/api/customers.api'

const BASE = 'http://localhost:8000/api/v1'

const mockCustomer = {
  id: 1, user_id: null, name: 'Carlos López', customer_type: 'PERSON' as const,
  email: 'carlos@test.com', phone: '3001', address: 'Cra 1', city: 'Bogotá',
  country: 'CO', tax_id: null, is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'Carlos López', customer_type: 'PERSON' as const, email: 'carlos@test.com', city: 'Bogotá', is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('customersApi.list', () => {
  it('sends default params', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/customers/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await customersApi.list()
    expect(params.page).toBe('1')
    expect(params.page_size).toBe('20')
  })

  it('includes search and customer_type when provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/customers/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await customersApi.list(1, 20, 'carlos', 'PERSON')
    expect(params.search).toBe('carlos')
    expect(params.customer_type).toBe('PERSON')
  })

  it('omits customer_type when not provided', async () => {
    let params: Record<string, string> = {}
    server.use(http.get(`${BASE}/customers/`, ({ request }) => {
      params = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await customersApi.list(1, 20, undefined, undefined)
    expect(params.customer_type).toBeUndefined()
  })
})

describe('customersApi.get', () => {
  it('fetches customer detail', async () => {
    server.use(http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer)))
    const res = await customersApi.get(1)
    expect(res.data.customer_type).toBe('PERSON')
  })
})

describe('customersApi.create', () => {
  it('posts to /customers/', async () => {
    let body: unknown
    server.use(http.post(`${BASE}/customers/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(mockCustomer, { status: 201 })
    }))
    const payload = { name: 'Carlos López', customer_type: 'PERSON' as const, email: 'carlos@test.com', phone: '3001', address: 'Cra 1', city: 'Bogotá', country: 'CO', is_active: true }
    const res = await customersApi.create(payload)
    expect(res.data.id).toBe(1)
    expect(body).toMatchObject({ name: 'Carlos López' })
  })
})

describe('customersApi.update', () => {
  it('patches /customers/{id}/', async () => {
    server.use(http.patch(`${BASE}/customers/1/`, async () => HttpResponse.json({ ...mockCustomer, city: 'Medellín' })))
    const res = await customersApi.update(1, { city: 'Medellín' })
    expect(res.data.city).toBe('Medellín')
  })
})

describe('customersApi.delete', () => {
  it('sends DELETE /customers/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/customers/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await customersApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('rejects with 404', async () => {
    server.use(http.get(`${BASE}/customers/999/`, () => HttpResponse.json({}, { status: 404 })))
    await expect(customersApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
