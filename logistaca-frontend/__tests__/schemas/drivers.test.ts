import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  first_name: z.string().min(1, 'Nombre requerido'),
  last_name: z.string().min(1, 'Apellido requerido'),
  transport_id: z.number().nullable().optional(),
  license_number: z.string().min(1, 'Número de licencia requerido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  is_available: z.boolean(),
  is_active: z.boolean(),
})

const VALID = {
  first_name: 'Juan', last_name: 'Pérez', transport_id: null,
  license_number: 'LIC-001', phone: '3001234567',
  is_available: true, is_active: true,
}

describe('driver schema', () => {
  it('passes with valid data', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with transport_id set', () => {
    expect(schema.safeParse({ ...VALID, transport_id: 2 }).success).toBe(true)
  })

  it('passes without transport_id field', () => {
    const { transport_id: _, ...rest } = VALID
    expect(schema.safeParse(rest).success).toBe(true)
  })

  it('fails when first_name is empty', () => {
    const r = schema.safeParse({ ...VALID, first_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.first_name).toContain('Nombre requerido')
  })

  it('fails when last_name is empty', () => {
    const r = schema.safeParse({ ...VALID, last_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.last_name).toContain('Apellido requerido')
  })

  it('fails when license_number is empty', () => {
    const r = schema.safeParse({ ...VALID, license_number: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.license_number).toContain('Número de licencia requerido')
  })

  it('fails when phone is empty', () => {
    const r = schema.safeParse({ ...VALID, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Teléfono requerido')
  })

  it('accepts is_available false', () => {
    expect(schema.safeParse({ ...VALID, is_available: false }).success).toBe(true)
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })
})
