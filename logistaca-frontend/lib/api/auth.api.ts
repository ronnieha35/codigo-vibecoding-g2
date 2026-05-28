import apiClient from './client'
import type { TokenResponse } from '@/lib/types/auth.types'

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/token/', { username, password }),

  refresh: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),

  verify: (token: string) =>
    apiClient.post('/auth/token/verify/', { token }),
}
