const ACCESS_TOKEN_KEY = 'logistica_access_token'
const REFRESH_TOKEN_KEY = 'logistica_refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(tokens: { access?: string; refresh?: string }): void {
  if (typeof window === 'undefined') return
  if (tokens.access !== undefined) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  if (tokens.refresh !== undefined) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}
