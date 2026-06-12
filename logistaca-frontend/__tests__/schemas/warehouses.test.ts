import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().min(1, 'País requerido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  capacity_m3: z.number().positive('Debe ser mayor a 0'),
  is_active: z.boolean(),
})

const VALID = {
  name: 'Bodega Norte', address: 'Calle 10 #5-20', city: 'Bogotá',
  country: 'CO', phone: '3001234567', capacity_m3: 500, is_active: true,
}

describe('warehouse schema', () => {
  it('passes with valid data', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
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

  it('fails when phone is empty', () => {
    const r = schema.safeParse({ ...VALID, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Teléfono requerido')
  })

  it('fails when capacity_m3 is zero', () => {
    const r = schema.safeParse({ ...VALID, capacity_m3: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.capacity_m3).toContain('Debe ser mayor a 0')
  })

  it('fails when capacity_m3 is negative', () => {
    const r = schema.safeParse({ ...VALID, capacity_m3: -10 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.capacity_m3).toContain('Debe ser mayor a 0')
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })
})
