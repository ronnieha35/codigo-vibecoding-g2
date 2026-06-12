import apiClient from './client'
import type { AuthUser, TokenResponse } from '@/lib/types/auth.types'

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/token/', { username, password }),

  refresh: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),

  verify: (token: string) =>
    apiClient.post('/auth/token/verify/', { token }),

  me: () =>
    apiClient.get<AuthUser>('/auth/me/'),

  updateMe: (data: { first_name?: string; last_name?: string; email?: string; password?: string }) =>
    apiClient.patch<AuthUser>('/auth/me/', data),
}
