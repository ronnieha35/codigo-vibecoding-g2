'use client'

import { useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { useCustomerList } from '@/lib/hooks/useCustomers'
import { useWarehouseList } from '@/lib/hooks/useWarehouses'
import { useDriverList } from '@/lib/hooks/useDrivers'
import { useTransportList } from '@/lib/hooks/useTransport'
import { useRouteList } from '@/lib/hooks/useRoutes'
import { useProductList } from '@/lib/hooks/useProducts'
import type { ShipmentDetail } from '@/lib/types/shipments.types'

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

export type ShipmentFormValues = z.infer<typeof schema>

const EMPTY: ShipmentFormValues = {
  customer_id: 0, origin_warehouse_id: 0,
  driver_id: null, transport_id: null, route_id: null,
  destination_address: '', destination_city: '', destination_country: '',
  status: 'PENDING', scheduled_date: '', shipping_cost: 0,
  total_weight_kg: 0, notes: '', items: [],
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_TRANSIT', label: 'En tránsito' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: ShipmentDetail
  onSubmit: (values: ShipmentFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function ShipmentForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ShipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const { data: customersData } = useCustomerList(1)
  const { data: warehousesData } = useWarehouseList(1)
  const { data: driversData } = useDriverList(1)
  const { data: transportsData } = useTransportList(1)
  const { data: routesData } = useRouteList(1)
  const { data: productsData } = useProductList(1)

  const customers = customersData?.results ?? []
  const warehouses = warehousesData?.results ?? []
  const drivers = driversData?.results ?? []
  const transports = transportsData?.results ?? []
  const routes = routesData?.results ?? []
  const products = productsData?.results ?? []

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            customer_id: defaultValues.customer_id,
            origin_warehouse_id: defaultValues.origin_warehouse_id,
            driver_id: defaultValues.driver_id,
            transport_id: defaultValues.transport_id,
            route_id: defaultValues.route_id,
            destination_address: defaultValues.destination_address,
            destination_city: defaultValues.destination_city,
            destination_country: defaultValues.destination_country,
            status: defaultValues.status,
            scheduled_date: defaultValues.scheduled_date,
            shipping_cost: defaultValues.shipping_cost,
            total_weight_kg: defaultValues.total_weight_kg,
            notes: defaultValues.notes ?? '',
            items: defaultValues.items.map((i) => ({
              product_id: i.product.id,
              quantity: i.quantity,
              unit_price: i.unit_price,
            })),
          }
        : EMPTY)
    }
  }, [open, defaultValues, reset])

  const optionalSelect = (value: number | null | undefined, onChange: (v: number | null) => void, placeholder: string, options: { id: number; label: string }[]) => (
    <Select
      value={value ? String(value) : 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : Number(v))}
    >
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Envío' : 'Nuevo Envío'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

          {/* Customer + Warehouse */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Cliente</Label>
              <Controller control={control} name="customer_id" render={({ field }) => (
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bodega origen</Label>
              <Controller control={control} name="origin_warehouse_id" render={({ field }) => (
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.origin_warehouse_id && <p className="text-sm text-destructive">{errors.origin_warehouse_id.message}</p>}
            </div>
          </div>

          {/* Optional FKs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Conductor <span className="text-zinc-400">(opc.)</span></Label>
              <Controller control={control} name="driver_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin conductor', drivers.map((d) => ({ id: d.id, label: d.license_number })))
              } />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vehículo <span className="text-zinc-400">(opc.)</span></Label>
              <Controller control={control} name="transport_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin vehículo', transports.map((t) => ({ id: t.id, label: `${t.name} — ${t.license_plate}` })))
              } />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ruta <span className="text-zinc-400">(opc.)</span></Label>
              <Controller control={control} name="route_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin ruta', routes.map((r) => ({ id: r.id, label: r.name })))
              } />
            </div>
          </div>

          {/* Destination */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="destination_address">Dirección destino</Label>
            <Input id="destination_address" {...register('destination_address')} />
            {errors.destination_address && <p className="text-sm text-destructive">{errors.destination_address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination_city">Ciudad destino</Label>
              <Input id="destination_city" {...register('destination_city')} />
              {errors.destination_city && <p className="text-sm text-destructive">{errors.destination_city.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination_country">País destino</Label>
              <Input id="destination_country" {...register('destination_country')} />
              {errors.destination_country && <p className="text-sm text-destructive">{errors.destination_country.message}</p>}
            </div>
          </div>

          {/* Status + Date + Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scheduled_date">Fecha programada</Label>
              <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
              {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping_cost">Costo envío</Label>
              <Input id="shipping_cost" type="number" step="0.01" {...register('shipping_cost', { valueAsNumber: true })} />
              {errors.shipping_cost && <p className="text-sm text-destructive">{errors.shipping_cost.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total_weight_kg">Peso total (kg)</Label>
              <Input id="total_weight_kg" type="number" step="0.01" {...register('total_weight_kg', { valueAsNumber: true })} />
              {errors.total_weight_kg && <p className="text-sm text-destructive">{errors.total_weight_kg.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas <span className="text-zinc-400">(opc.)</span></Label>
            <Input id="notes" {...register('notes')} />
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: 0, quantity: 1, unit_price: 0 })}>
                <Plus className="w-4 h-4 mr-1" /> Agregar item
              </Button>
            </div>
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
            {fields.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-2">Sin items. Agrega al menos uno.</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Producto</Label>
                    <Controller control={control} name={`items.${index}.product_id`} render={({ field: f }) => (
                      <Select value={f.value ? String(f.value) : ''} onValueChange={(v) => f.onChange(Number(v))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                    {errors.items?.[index]?.product_id && <p className="text-xs text-destructive">{errors.items[index]?.product_id?.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">{errors.items[index]?.quantity?.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Precio unit.</Label>
                    <Input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                    {errors.items?.[index]?.unit_price && <p className="text-xs text-destructive">{errors.items[index]?.unit_price?.message}</p>}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive mt-1" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear envío'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
