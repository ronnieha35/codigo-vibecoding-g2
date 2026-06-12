import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const itemSchema = z.object({
  product_id: z.number().positive('Producto requerido'),
  quantity: z.number().int().min(1, 'Mínimo 1'),
  unit_price: z.number().positive('Precio requerido'),
})

const schema = z.object({
  customer_id: z.number().positive('Cliente requerido'),
  origin_warehouse_id: z.number().positive('Bodega requerida'),
  driver_id: z.number().nullable().optional(),
  transport_id: z.number().nullable().optional(),
  route_id: z.number().nullable().optional(),
  destination_address: z.string().min(1, 'Dirección requerida'),
  destination_city: z.string().min(1, 'Ciudad requerida'),
  destination_country: z.string().min(1, 'País requerido'),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  scheduled_date: z.string().min(1, 'Fecha requerida'),
  shipping_cost: z.number().positive('Costo requerido'),
  total_weight_kg: z.number().positive('Peso requerido'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Agrega al menos un item'),
})

const VALID_ITEM = { product_id: 10, quantity: 2, unit_price: 50 }

const VALID = {
  customer_id: 1, origin_warehouse_id: 5,
  driver_id: null, transport_id: null, route_id: null,
  destination_address: 'Cra 1 #2-3', destination_city: 'Bogotá', destination_country: 'CO',
  status: 'PENDING' as const, scheduled_date: '2024-06-01',
  shipping_cost: 100, total_weight_kg: 10,
  notes: '', items: [VALID_ITEM],
}

describe('shipment schema', () => {
  it('passes with valid data', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('passes with all optional fields set', () => {
    const r = schema.safeParse({ ...VALID, driver_id: 2, transport_id: 3, route_id: 4, notes: 'Fragile' })
    expect(r.success).toBe(true)
  })

  it('fails when customer_id is zero', () => {
    const r = schema.safeParse({ ...VALID, customer_id: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.customer_id).toContain('Cliente requerido')
  })

  it('fails when origin_warehouse_id is zero', () => {
    const r = schema.safeParse({ ...VALID, origin_warehouse_id: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.origin_warehouse_id).toContain('Bodega requerida')
  })

  it('fails when destination_address is empty', () => {
    const r = schema.safeParse({ ...VALID, destination_address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_address).toContain('Dirección requerida')
  })

  it('fails when destination_city is empty', () => {
    const r = schema.safeParse({ ...VALID, destination_city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_city).toContain('Ciudad requerida')
  })

  it('fails when destination_country is empty', () => {
    const r = schema.safeParse({ ...VALID, destination_country: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_country).toContain('País requerido')
  })

  it('fails when status is invalid', () => {
    const r = schema.safeParse({ ...VALID, status: 'UNKNOWN' })
    expect(r.success).toBe(false)
  })

  it('accepts all valid status values', () => {
    const statuses = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const
    for (const status of statuses) {
      expect(schema.safeParse({ ...VALID, status }).success).toBe(true)
    }
  })

  it('fails when scheduled_date is empty', () => {
    const r = schema.safeParse({ ...VALID, scheduled_date: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.scheduled_date).toContain('Fecha requerida')
  })

  it('fails when shipping_cost is zero', () => {
    const r = schema.safeParse({ ...VALID, shipping_cost: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.shipping_cost).toContain('Costo requerido')
  })

  it('fails when total_weight_kg is zero', () => {
    const r = schema.safeParse({ ...VALID, total_weight_kg: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.total_weight_kg).toContain('Peso requerido')
  })

  it('fails when items is empty', () => {
    const r = schema.safeParse({ ...VALID, items: [] })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.items).toContain('Agrega al menos un item')
  })

  describe('item sub-schema', () => {
    it('fails when item product_id is zero', () => {
      const r = schema.safeParse({ ...VALID, items: [{ ...VALID_ITEM, product_id: 0 }] })
      expect(r.success).toBe(false)
    })

    it('fails when item quantity is zero', () => {
      const r = schema.safeParse({ ...VALID, items: [{ ...VALID_ITEM, quantity: 0 }] })
      expect(r.success).toBe(false)
    })

    it('fails when item quantity is non-integer', () => {
      const r = schema.safeParse({ ...VALID, items: [{ ...VALID_ITEM, quantity: 1.5 }] })
      expect(r.success).toBe(false)
    })

    it('fails when item unit_price is zero', () => {
      const r = schema.safeParse({ ...VALID, items: [{ ...VALID_ITEM, unit_price: 0 }] })
      expect(r.success).toBe(false)
    })
  })
})
