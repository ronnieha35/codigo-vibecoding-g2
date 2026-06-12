import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import axiosInstance from '@/lib/axios'

const BASE_URL = 'http://localhost:8000/api/v1'
const ACCESS_KEY = 'logistica_access_token'
const REFRESH_KEY = 'logistica_refresh_token'

// Replace window.location with a writable mock.
// Must keep href as a valid URL so MSW's `new URL(url, window.location.href)` doesn't throw.
// After each test that triggers a redirect, href will be '/login'.
const locationMock = { href: 'http://localhost:3000' }

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: locationMock,
  })
})

beforeEach(() => {
  localStorage.clear()
  locationMock.href = 'http://localhost:3000'
})

// ---------------------------------------------------------------------------
// Request interceptor
// ---------------------------------------------------------------------------

describe('request interceptor', () => {
  it('adds Authorization: Bearer <token> when access token exists', async () => {
    let captured: string | null = null
    server.use(
      http.get(`${BASE_URL}/ping/`, ({ request }) => {
        captured = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    localStorage.setItem(ACCESS_KEY, 'my-access-token')
    await axiosInstance.get('/ping/')
    expect(captured).toBe('Bearer my-access-token')
  })

  it('does NOT add Authorization header when no token', async () => {
    let captured: string | null | undefined = undefined
    server.use(
      http.get(`${BASE_URL}/ping/`, ({ request }) => {
        captured = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    // localStorage is clear — no token
    await axiosInstance.get('/ping/')
    expect(captured).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Response interceptor — 401 handling
// ---------------------------------------------------------------------------

describe('response interceptor', () => {
  it('401 with valid refresh: calls /auth/token/refresh/, saves new access, retries with new token', async () => {
    localStorage.setItem(ACCESS_KEY, 'old-token')
    localStorage.setItem(REFRESH_KEY, 'valid-refresh')

    let retryAuthHeader: string | null = null
    let requestCount = 0

    server.use(
      http.get(`${BASE_URL}/protected/`, ({ request }) => {
        requestCount++
        const auth = request.headers.get('Authorization')
        // Only the retry (with the new token) succeeds.
        if (auth === 'Bearer new-access-token') {
          retryAuthHeader = auth
          return HttpResponse.json({ data: 'ok' })
        }
        return HttpResponse.json({}, { status: 401 })
      }),
      http.post(`${BASE_URL}/auth/token/refresh/`, async ({ request }) => {
        const body = (await request.json()) as { refresh: string }
        if (body.refresh === 'valid-refresh') {
          return HttpResponse.json({ access: 'new-access-token' })
        }
        return HttpResponse.json({}, { status: 401 })
      })
    )

    const res = await axiosInstance.get('/protected/')

    expect(res.data).toEqual({ data: 'ok' })
    expect(retryAuthHeader).toBe('Bearer new-access-token')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('new-access-token')
    expect(requestCount).toBe(2) // initial 401 + one retry
  })

  it('401 without refresh token: calls clearTokens and redirects to /login', async () => {
    localStorage.setItem(ACCESS_KEY, 'expired-token')
    // No REFRESH_KEY set

    server.use(
      http.get(`${BASE_URL}/protected/`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    )

    await expect(axiosInstance.get('/protected/')).rejects.toThrow()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(locationMock.href).toBe('/login')
  })

  it('401 whose refresh also fails: clearTokens + redirect + promise rejects', async () => {
    localStorage.setItem(ACCESS_KEY, 'old-token')
    localStorage.setItem(REFRESH_KEY, 'bad-refresh')

    server.use(
      http.get(`${BASE_URL}/protected/`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${BASE_URL}/auth/token/refresh/`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    )

    await expect(axiosInstance.get('/protected/')).rejects.toThrow()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(locationMock.href).toBe('/login')
  })

  it('_retry flag prevents infinite loop: refresh endpoint called exactly once', async () => {
    localStorage.setItem(ACCESS_KEY, 'old-token')
    localStorage.setItem(REFRESH_KEY, 'valid-refresh')

    let refreshCallCount = 0

    server.use(
      // Always 401 — even after a successful refresh.
      http.get(`${BASE_URL}/protected/`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${BASE_URL}/auth/token/refresh/`, () => {
        refreshCallCount++
        return HttpResponse.json({ access: 'new-token' })
      })
    )

    await expect(axiosInstance.get('/protected/')).rejects.toThrow()
    expect(refreshCallCount).toBe(1)
  })
})
