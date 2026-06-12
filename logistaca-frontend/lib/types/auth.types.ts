export interface TokenResponse {
  access: string
  refresh: string
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
}

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active?: boolean
  is_superuser: boolean
  permissions: string[]
  groups?: { id: number; name: string }[]
  date_joined?: string
}

export interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}
