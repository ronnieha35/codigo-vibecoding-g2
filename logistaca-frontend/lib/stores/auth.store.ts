'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, AuthUser } from '@/lib/types/auth.types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setTokens: (access: string, refresh: string) =>
        set({ token: access, refreshToken: refresh }),
      setUser: (user: AuthUser) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'logistaca-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
