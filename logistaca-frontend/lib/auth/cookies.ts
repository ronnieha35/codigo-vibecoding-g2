'use client'

import { getCookie, setCookie, deleteCookie } from 'cookies-next'

const TOKEN_COOKIE = 'logistaca-token'

export function getAuthCookie(): string | undefined {
  return getCookie(TOKEN_COOKIE) as string | undefined
}

export function setAuthCookie(token: string): void {
  setCookie(TOKEN_COOKIE, token, {
    maxAge: 60 * 60,
    path: '/',
    sameSite: 'lax',
  })
}

export function deleteAuthCookie(): void {
  deleteCookie(TOKEN_COOKIE, { path: '/' })
}
