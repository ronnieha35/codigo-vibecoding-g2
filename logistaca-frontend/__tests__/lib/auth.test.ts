import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  setTokens,
} from '@/lib/auth'

const ACCESS_KEY = 'logistica_access_token'
const REFRESH_KEY = 'logistica_refresh_token'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getAccessToken', () => {
  it('returns null when no token stored', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('returns stored access token', () => {
    localStorage.setItem(ACCESS_KEY, 'acc-abc')
    expect(getAccessToken()).toBe('acc-abc')
  })
})

describe('getRefreshToken', () => {
  it('returns null when no token stored', () => {
    expect(getRefreshToken()).toBeNull()
  })

  it('returns stored refresh token', () => {
    localStorage.setItem(REFRESH_KEY, 'ref-xyz')
    expect(getRefreshToken()).toBe('ref-xyz')
  })
})

describe('setTokens', () => {
  it('sets access only — does not touch refresh', () => {
    localStorage.setItem(REFRESH_KEY, 'existing-refresh')
    setTokens({ access: 'new-access' })
    expect(localStorage.getItem(ACCESS_KEY)).toBe('new-access')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('existing-refresh')
  })

  it('sets refresh only — does not touch access', () => {
    localStorage.setItem(ACCESS_KEY, 'existing-access')
    setTokens({ refresh: 'new-refresh' })
    expect(localStorage.getItem(REFRESH_KEY)).toBe('new-refresh')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('existing-access')
  })

  it('sets both tokens when both provided', () => {
    setTokens({ access: 'acc', refresh: 'ref' })
    expect(localStorage.getItem(ACCESS_KEY)).toBe('acc')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('ref')
  })
})

describe('clearTokens', () => {
  it('removes both tokens from localStorage', () => {
    localStorage.setItem(ACCESS_KEY, 'acc')
    localStorage.setItem(REFRESH_KEY, 'ref')
    clearTokens()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})

describe('isAuthenticated', () => {
  it('returns true when access token exists', () => {
    localStorage.setItem(ACCESS_KEY, 'some-token')
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false when no token', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns false when token is empty string', () => {
    localStorage.setItem(ACCESS_KEY, '')
    expect(isAuthenticated()).toBe(false)
  })
})

describe('SSR guards (typeof window === "undefined")', () => {
  it('getAccessToken returns null in SSR context', () => {
    vi.stubGlobal('window', undefined)
    expect(getAccessToken()).toBeNull()
  })

  it('getRefreshToken returns null in SSR context', () => {
    vi.stubGlobal('window', undefined)
    expect(getRefreshToken()).toBeNull()
  })

  it('isAuthenticated returns false in SSR context', () => {
    vi.stubGlobal('window', undefined)
    expect(isAuthenticated()).toBe(false)
  })

  it('setTokens does not throw in SSR context', () => {
    vi.stubGlobal('window', undefined)
    expect(() => setTokens({ access: 'token', refresh: 'ref' })).not.toThrow()
  })

  it('clearTokens does not throw in SSR context', () => {
    vi.stubGlobal('window', undefined)
    expect(() => clearTokens()).not.toThrow()
  })
})
