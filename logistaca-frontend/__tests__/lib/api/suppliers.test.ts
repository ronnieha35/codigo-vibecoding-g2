import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { suppliersApi } from '@/lib/api/suppliers.api'

const BASE = 'http://localhost:8000/api/v1'

const mockSupplier = {
  id: 1, name: 'ACME', email: 'acme@test.com', phone: '123', address: 'St 1',
  city: 'Bogotá', country: 'CO', tax_id: '900', contact_name: 'Ana', is_active: true,
  created_at: '2024-01-01', updated_at: '2024-01-01',
}
const mockList = { count: 1, next: null, previous: null, results: [{ id: 1, name: 'ACME', email: 'acme@test.com', tax_id: '900', is_active: true }] }

beforeEach(() => { localStorage.clear() })

describe('suppliersApi.list', () => {
  it('calls GET /suppliers/ with default params', async () => {
    let captured: Record<string, string> = {}
    server.use(http.get(`${BASE}/suppliers/`, ({ request }) => {
      captured = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    const res = await suppliersApi.list()
    expect(res.data).toEqual(mockList)
    expect(captured.page).toBe('1')
    expect(captured.page_size).toBe('20')
    expect(captured.search).toBeUndefined()
  })

  it('passes search param when provided', async () => {
    let captured: Record<string, string> = {}
    server.use(http.get(`${BASE}/suppliers/`, ({ request }) => {
      captured = Object.fromEntries(new URL(request.url).searchParams)
      return HttpResponse.json(mockList)
    }))
    await suppliersApi.list(2, 20, 'acme')
    expect(captured.search).toBe('acme')
    expect(captured.page).toBe('2')
  })
})

describe('suppliersApi.get', () => {
  it('calls GET /suppliers/{id}/', async () => {
    server.use(http.get(`${BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier)))
    const res = await suppliersApi.get(1)
    expect(res.data.id).toBe(1)
    expect(res.data.name).toBe('ACME')
  })
})

describe('suppliersApi.create', () => {
  it('calls POST /suppliers/ with payload', async () => {
    let body: unknown
    server.use(http.post(`${BASE}/suppliers/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(mockSupplier, { status: 201 })
    }))
    const payload = { name: 'ACME', email: 'acme@test.com', phone: '123', address: 'St 1', city: 'Bogotá', country: 'CO', tax_id: '900', contact_name: 'Ana', is_active: true }
    const res = await suppliersApi.create(payload)
    expect(res.data.id).toBe(1)
    expect(body).toMatchObject({ name: 'ACME' })
  })
})

describe('suppliersApi.update', () => {
  it('calls PATCH /suppliers/{id}/', async () => {
    let method = ''
    server.use(http.patch(`${BASE}/suppliers/1/`, async ({ request }) => {
      method = request.method
      return HttpResponse.json({ ...mockSupplier, name: 'Updated' })
    }))
    const res = await suppliersApi.update(1, { name: 'Updated' })
    expect(method).toBe('PATCH')
    expect(res.data.name).toBe('Updated')
  })
})

describe('suppliersApi.delete', () => {
  it('calls DELETE /suppliers/{id}/', async () => {
    let method = ''
    server.use(http.delete(`${BASE}/suppliers/1/`, ({ request }) => {
      method = request.method
      return new HttpResponse(null, { status: 204 })
    }))
    await suppliersApi.delete(1)
    expect(method).toBe('DELETE')
  })
})

describe('error propagation', () => {
  it('propagates 404 without swallowing', async () => {
    server.use(http.get(`${BASE}/suppliers/999/`, () => HttpResponse.json({ detail: 'Not found' }, { status: 404 })))
    await expect(suppliersApi.get(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
