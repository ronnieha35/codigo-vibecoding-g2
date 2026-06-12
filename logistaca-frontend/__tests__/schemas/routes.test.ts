import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const stopSchema = z.object({
  warehouse_id: z.number().positive('Bodega requerida'),
  estimated_duration_minutes: z.number().int().min(1, 'Mínimo 1 minuto'),
})

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  origin_warehouse_id: z.number().positive('Bodega origen requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  estimated_duration_hours: z.number().positive('Debe ser mayor a 0'),
  is_active: z.boolean(),
  stops: z.array(stopSchema),
})

const VALID = {
  name: 'Ruta Norte', origin_warehouse_id: 5, description: 'Ruta hacia el norte',
  estimated_duration_hours: 3.5, is_active: true, stops: [],
}

describe('route schema', () => {
  it('passes with no stops', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with valid stops', () => {
    const r = schema.safeParse({
      ...VALID,
      stops: [{ warehouse_id: 2, estimated_duration_minutes: 30 }],
    })
    expect(r.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
  })

  it('fails when origin_warehouse_id is zero', () => {
    const r = schema.safeParse({ ...VALID, origin_warehouse_id: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.origin_warehouse_id).toContain('Bodega origen requerida')
  })

  it('fails when description is empty', () => {
    const r = schema.safeParse({ ...VALID, description: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.description).toContain('Descripción requerida')
  })

  it('fails when estimated_duration_hours is zero', () => {
    const r = schema.safeParse({ ...VALID, estimated_duration_hours: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.estimated_duration_hours).toContain('Debe ser mayor a 0')
  })

  it('accepts is_active false', () => {
    expect(schema.safeParse({ ...VALID, is_active: false }).success).toBe(true)
  })

  describe('stop sub-schema', () => {
    it('fails when stop warehouse_id is zero', () => {
      const r = schema.safeParse({
        ...VALID,
        stops: [{ warehouse_id: 0, estimated_duration_minutes: 30 }],
      })
      expect(r.success).toBe(false)
    })

    it('fails when stop estimated_duration_minutes is zero', () => {
      const r = schema.safeParse({
        ...VALID,
        stops: [{ warehouse_id: 2, estimated_duration_minutes: 0 }],
      })
      expect(r.success).toBe(false)
    })

    it('fails when stop estimated_duration_minutes is non-integer', () => {
      const r = schema.safeParse({
        ...VALID,
        stops: [{ warehouse_id: 2, estimated_duration_minutes: 1.5 }],
      })
      expect(r.success).toBe(false)
    })
  })
})
