import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  customer_type: z.enum(['PERSON', 'COMPANY']),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().min(1, 'País requerido'),
  tax_id: z.string().nullable().optional(),
  is_active: z.boolean(),
})

const VALID = {
  name: 'Carlos Gómez', customer_type: 'PERSON' as const, email: 'carlos@test.com',
  phone: '3001234567', address: 'Cra 1 #2-3', city: 'Bogotá', country: 'CO',
  tax_id: null, is_active: true,
}

describe('customer schema', () => {
  it('passes with PERSON type', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with COMPANY type', () => {
    expect(schema.safeParse({ ...VALID, customer_type: 'COMPANY' }).success).toBe(true)
  })

  it('passes with optional tax_id set', () => {
    expect(schema.safeParse({ ...VALID, tax_id: '900123456-1' }).success).toBe(true)
  })

  it('passes without tax_id field', () => {
    const { tax_id: _, ...rest } = VALID
    expect(schema.safeParse(rest).success).toBe(true)
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
  })

  it('fails when customer_type is invalid', () => {
    const r = schema.safeParse({ ...VALID, customer_type: 'INDIVIDUAL' })
    expect(r.success).toBe(false)
  })

  it('fails when email is invalid', () => {
    const r = schema.safeParse({ ...VALID, email: 'not-email' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toContain('Email inválido')
  })

  it('fails when phone is empty', () => {
    const r = schema.safeParse({ ...VALID, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Teléfono requerido')
  })

  it('fails when address is empty', () => {
    const r = schema.safeParse({ ...VALID, address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.address).toContain('Dirección requerida')
  })

  it('fails when city is empty', () => {
    const r = schema.safeParse({ ...VALID, city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.city).toContain('Ciudad requerida')
  })

  it('fails when country is empty', () => {
    const r = schema.safeParse({ ...VALID, country: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.country).toContain('País requerido')
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })
})
