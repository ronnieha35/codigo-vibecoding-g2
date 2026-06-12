'use client'

import { useEffect } from 'react'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/lib/stores/auth.store'

export function useMe() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (!token) return
    authApi.me().then((res) => setUser(res.data)).catch(() => {})
  }, [token, setUser])
}
