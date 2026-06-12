import { describe, expect, it } from 'vitest'
import { loginSchema } from '@/schemas/login'

describe('loginSchema', () => {
  it('passes with valid username and password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('fails when username is empty', () => {
    const result = loginSchema.safeParse({ username: '', password: 'secret123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const usernameErrors = result.error.flatten().fieldErrors.username
      expect(usernameErrors).toContain('Usuario requerido')
    }
  })

  it('fails when password is empty', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors).toContain('Contraseña requerida')
    }
  })

  it('fails when both fields are empty', () => {
    const result = loginSchema.safeParse({ username: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      expect(flat.username).toContain('Usuario requerido')
      expect(flat.password).toContain('Contraseña requerida')
    }
  })
})
