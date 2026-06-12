import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().min(1, 'País requerido'),
  tax_id: z.string().min(1, 'Tax ID requerido'),
  contact_name: z.string().min(1, 'Nombre de contacto requerido'),
  is_active: z.boolean(),
})

const VALID = {
  name: 'Proveedor S.A.', email: 'prov@test.com', phone: '3001234567',
  address: 'Cra 10 #20-30', city: 'Bogotá', country: 'CO',
  tax_id: '900123456-1', contact_name: 'Ana López', is_active: true,
}

describe('supplier schema', () => {
  it('passes with valid data', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
  })

  it('fails when email is invalid', () => {
    const r = schema.safeParse({ ...VALID, email: 'not-an-email' })
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

  it('fails when tax_id is empty', () => {
    const r = schema.safeParse({ ...VALID, tax_id: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.tax_id).toContain('Tax ID requerido')
  })

  it('fails when contact_name is empty', () => {
    const r = schema.safeParse({ ...VALID, contact_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.contact_name).toContain('Nombre de contacto requerido')
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })
})
