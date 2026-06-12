import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  license_plate: z.string().min(1, 'Placa requerida'),
  vehicle_type: z.enum(['TRUCK', 'VAN', 'MOTORCYCLE', 'OTHER']),
  capacity_kg: z.number().positive('Debe ser mayor a 0'),
  capacity_m3: z.number().positive('Debe ser mayor a 0'),
  is_available: z.boolean(),
  is_active: z.boolean(),
})

const VALID = {
  name: 'Camión 01', license_plate: 'ABC-123', vehicle_type: 'TRUCK' as const,
  capacity_kg: 5000, capacity_m3: 20, is_available: true, is_active: true,
}

describe('transport schema', () => {
  it('passes with TRUCK type', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with VAN type', () => {
    expect(schema.safeParse({ ...VALID, vehicle_type: 'VAN' }).success).toBe(true)
  })

  it('passes with MOTORCYCLE type', () => {
    expect(schema.safeParse({ ...VALID, vehicle_type: 'MOTORCYCLE' }).success).toBe(true)
  })

  it('passes with OTHER type', () => {
    expect(schema.safeParse({ ...VALID, vehicle_type: 'OTHER' }).success).toBe(true)
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
  })

  it('fails when license_plate is empty', () => {
    const r = schema.safeParse({ ...VALID, license_plate: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.license_plate).toContain('Placa requerida')
  })

  it('fails when vehicle_type is invalid', () => {
    const r = schema.safeParse({ ...VALID, vehicle_type: 'BUS' })
    expect(r.success).toBe(false)
  })

  it('fails when capacity_kg is zero', () => {
    const r = schema.safeParse({ ...VALID, capacity_kg: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.capacity_kg).toContain('Debe ser mayor a 0')
  })

  it('fails when capacity_m3 is zero', () => {
    const r = schema.safeParse({ ...VALID, capacity_m3: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.capacity_m3).toContain('Debe ser mayor a 0')
  })

  it('accepts is_available false', () => {
    expect(schema.safeParse({ ...VALID, is_available: false }).success).toBe(true)
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })
})
