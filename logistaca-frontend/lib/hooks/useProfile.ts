'use client'

import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/lib/stores/auth.store'

interface ProfileWrite {
  first_name: string
  last_name: string
  email: string
  password?: string
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  const currentUser = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (data: ProfileWrite) => {
      const payload = { ...data }
      if (!payload.password) delete payload.password
      return authApi.updateMe(payload).then((r) => r.data)
    },
    onSuccess: (updated) => {
      if (currentUser) {
        setUser({ ...currentUser, ...updated })
      }
    },
  })
}
