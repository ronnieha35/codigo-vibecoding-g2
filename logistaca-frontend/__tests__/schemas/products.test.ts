import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const schema = z.object({
  supplier_id: z.number().positive('Proveedor requerido'),
  warehouse_id: z.number().nullable().optional(),
  name: z.string().min(1, 'Nombre requerido'),
  sku: z.string().min(1, 'SKU requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  category: z.string().min(1, 'Categoría requerida'),
  unit_price: z.number().positive('Debe ser mayor a 0'),
  weight_kg: z.number().positive('Debe ser mayor a 0'),
  length_cm: z.number().positive('Debe ser mayor a 0'),
  width_cm: z.number().positive('Debe ser mayor a 0'),
  height_cm: z.number().positive('Debe ser mayor a 0'),
  stock_quantity: z.number().int().min(0, 'Stock no puede ser negativo'),
  is_active: z.boolean(),
})

const VALID = {
  supplier_id: 1, warehouse_id: null, name: 'Producto A', sku: 'SKU-001',
  description: 'Descripción del producto', category: 'Electrónica',
  unit_price: 50, weight_kg: 1.5, length_cm: 20, width_cm: 15, height_cm: 10,
  stock_quantity: 100, is_active: true,
}

describe('product schema', () => {
  it('passes with valid data', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with warehouse_id set', () => {
    expect(schema.safeParse({ ...VALID, warehouse_id: 3 }).success).toBe(true)
  })

  it('fails when supplier_id is zero', () => {
    const r = schema.safeParse({ ...VALID, supplier_id: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.supplier_id).toContain('Proveedor requerido')
  })

  it('fails when name is empty', () => {
    const r = schema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Nombre requerido')
  })

  it('fails when sku is empty', () => {
    const r = schema.safeParse({ ...VALID, sku: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.sku).toContain('SKU requerido')
  })

  it('fails when description is empty', () => {
    const r = schema.safeParse({ ...VALID, description: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.description).toContain('Descripción requerida')
  })

  it('fails when category is empty', () => {
    const r = schema.safeParse({ ...VALID, category: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.category).toContain('Categoría requerida')
  })

  it('fails when unit_price is zero', () => {
    const r = schema.safeParse({ ...VALID, unit_price: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.unit_price).toContain('Debe ser mayor a 0')
  })

  it('fails when weight_kg is zero', () => {
    const r = schema.safeParse({ ...VALID, weight_kg: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.weight_kg).toContain('Debe ser mayor a 0')
  })

  it('fails when length_cm is zero', () => {
    const r = schema.safeParse({ ...VALID, length_cm: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.length_cm).toContain('Debe ser mayor a 0')
  })

  it('fails when width_cm is zero', () => {
    const r = schema.safeParse({ ...VALID, width_cm: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.width_cm).toContain('Debe ser mayor a 0')
  })

  it('fails when height_cm is zero', () => {
    const r = schema.safeParse({ ...VALID, height_cm: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.height_cm).toContain('Debe ser mayor a 0')
  })

  it('fails when stock_quantity is negative', () => {
    const r = schema.safeParse({ ...VALID, stock_quantity: -1 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.stock_quantity).toContain('Stock no puede ser negativo')
  })

  it('passes when stock_quantity is zero', () => {
    expect(schema.safeParse({ ...VALID, stock_quantity: 0 }).success).toBe(true)
  })

  it('fails when stock_quantity is non-integer', () => {
    const r = schema.safeParse({ ...VALID, stock_quantity: 1.5 })
    expect(r.success).toBe(false)
  })
})
