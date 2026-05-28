'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/lib/stores/auth.store'
import { setAuthCookie } from '@/lib/auth/cookies'
import type { ApiError } from '@/lib/types/api.types'
import type { AxiosError } from 'axios'

interface LoginCredentials {
  username: string
  password: string
}

interface LoginError {
  message: string
}

export function useLogin() {
  const router = useRouter()
  const setTokens = useAuthStore((s) => s.setTokens)

  return useMutation<void, LoginError, LoginCredentials>({
    mutationFn: async ({ username, password }) => {
      const res = await authApi.login(username, password)
      const { access, refresh } = res.data
      setTokens(access, refresh)
      setAuthCookie(access)
    },
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
    onError: (_err, _vars, _ctx) => {},
  })
}

export function extractLoginError(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>
  const data = axiosError?.response?.data
  if (data?.error) {
    const messages = Object.values(data.error).flat()
    return messages[0] ?? 'Credenciales inválidas'
  }
  return 'Error al conectar con el servidor'
}
