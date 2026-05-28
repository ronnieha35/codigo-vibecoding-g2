export interface TokenResponse {
  access: string
  refresh: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}
