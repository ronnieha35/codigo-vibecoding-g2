import axios from 'axios'
import { setCookie, deleteCookie } from 'cookies-next'
import { useAuthStore } from '@/lib/stores/auth.store'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

function processQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken))
  refreshQueue = []
}

function forceLogout() {
  isRefreshing = false
  refreshQueue = []
  useAuthStore.getState().logout()
  deleteCookie('logistaca-token', { path: '/' })
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(error)
    }

    // Queue concurrent 401s while a refresh is already in flight.
    if (isRefreshing) {
      return new Promise<unknown>((resolve) => {
        refreshQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{ access: string }>(
        `${BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken }
      )

      const newToken = data.access
      useAuthStore.getState().setTokens(newToken, refreshToken)
      setCookie('logistaca-token', newToken, { maxAge: 3600, path: '/', sameSite: 'lax' })
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      processQueue(newToken)
      isRefreshing = false

      return apiClient(originalRequest)
    } catch {
      forceLogout()
      return Promise.reject(error)
    }
  }
)

export default apiClient
