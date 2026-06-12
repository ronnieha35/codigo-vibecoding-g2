'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useCustomerList } from '@/lib/hooks/useCustomers'
import { useWarehouseList } from '@/lib/hooks/useWarehouses'
import { useDriverList } from '@/lib/hooks/useDrivers'
import { useTransportList } from '@/lib/hooks/useTransport'
import { useRouteList } from '@/lib/hooks/useRoutes'
import { useProductList } from '@/lib/hooks/useProducts'
import { useShipmentDetail, useCreateShipment, useUpdateShipment } from '@/lib/hooks/useShipments'

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

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <Separator />
      </div>
      {children}
    </div>
  )
}

interface Props {
  shipmentId?: number
}

export default function ShipmentFormPage({ shipmentId }: Props) {
  const router = useRouter()
  const isEdit = !!shipmentId

  const { data: detail, isLoading: detailLoading } = useShipmentDetail(shipmentId ?? null)
  const createMutation = useCreateShipment()
  const updateMutation = useUpdateShipment()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
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
    if (detail) {
      reset({
        customer_id: detail.customer_id,
        origin_warehouse_id: detail.origin_warehouse_id,
        driver_id: detail.driver_id,
        transport_id: detail.transport_id,
        route_id: detail.route_id,
        destination_address: detail.destination_address,
        destination_city: detail.destination_city,
        destination_country: detail.destination_country,
        status: detail.status,
        scheduled_date: detail.scheduled_date,
        shipping_cost: detail.shipping_cost,
        total_weight_kg: detail.total_weight_kg,
        notes: detail.notes ?? '',
        items: detail.items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      })
    }
  }, [detail, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      driver_id: values.driver_id ?? null,
      transport_id: values.transport_id ?? null,
      route_id: values.route_id ?? null,
    }

    if (isEdit && shipmentId) {
      updateMutation.mutate(
        { id: shipmentId, data: payload },
        { onSuccess: () => router.push('/shipments') }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => router.push('/shipments'),
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const serverError = createMutation.isError || updateMutation.isError
    ? 'Error al guardar el envío. Verifica los datos.'
    : null

  const optionalSelect = (
    value: number | null | undefined,
    onChange: (v: number | null) => void,
    placeholder: string,
    options: { id: number; label: string }[]
  ) => {
    const label = value ? (options.find((o) => o.id === value)?.label ?? placeholder) : placeholder
    return (
      <Select value={value ? String(value) : 'none'} onValueChange={(v) => onChange(v === 'none' ? null : Number(v))}>
        <SelectTrigger>
          <SelectValue>{label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{placeholder}</SelectItem>
          {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }

  if (isEdit && detailLoading) {
    return <div className="py-20 text-center text-muted-foreground">Cargando envío...</div>
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/shipments')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? `Editar Envío #${shipmentId}` : 'Nuevo Envío'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Modifica los datos del envío' : 'Completa los datos para crear un nuevo envío'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

        {/* Partes del envío */}
        <Section title="Partes del envío">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Cliente</Label>
              <Controller control={control} name="customer_id" render={({ field }) => (
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue>{field.value ? (customers.find((c) => c.id === field.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bodega origen</Label>
              <Controller control={control} name="origin_warehouse_id" render={({ field }) => (
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue>{field.value ? (warehouses.find((w) => w.id === field.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.origin_warehouse_id && <p className="text-sm text-destructive">{errors.origin_warehouse_id.message}</p>}
            </div>
          </div>
        </Section>

        {/* Asignación operativa */}
        <Section title="Asignación operativa">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Conductor <span className="text-muted-foreground text-xs">(opc.)</span></Label>
              <Controller control={control} name="driver_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin conductor',
                  drivers.map((d) => ({ id: d.id, label: `${d.first_name} ${d.last_name}` })))
              } />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vehículo <span className="text-muted-foreground text-xs">(opc.)</span></Label>
              <Controller control={control} name="transport_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin vehículo',
                  transports.map((t) => ({ id: t.id, label: `${t.name} — ${t.license_plate}` })))
              } />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ruta <span className="text-muted-foreground text-xs">(opc.)</span></Label>
              <Controller control={control} name="route_id" render={({ field }) =>
                optionalSelect(field.value, field.onChange, 'Sin ruta',
                  routes.map((r) => ({ id: r.id, label: r.name })))
              } />
            </div>
          </div>
        </Section>

        {/* Destino */}
        <Section title="Destino">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="destination_address">Dirección</Label>
            <Input id="destination_address" placeholder="Calle, número, colonia..." {...register('destination_address')} />
            {errors.destination_address && <p className="text-sm text-destructive">{errors.destination_address.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination_city">Ciudad</Label>
              <Input id="destination_city" placeholder="Ej. Guatemala" {...register('destination_city')} />
              {errors.destination_city && <p className="text-sm text-destructive">{errors.destination_city.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination_country">País</Label>
              <Input id="destination_country" placeholder="Ej. Guatemala" {...register('destination_country')} />
              {errors.destination_country && <p className="text-sm text-destructive">{errors.destination_country.message}</p>}
            </div>
          </div>
        </Section>

        {/* Logística */}
        <Section title="Logística">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue>{STATUS_OPTIONS.find((s) => s.value === field.value)?.label ?? field.value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scheduled_date">Fecha programada</Label>
              <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
              {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping_cost">Costo de envío</Label>
              <Input id="shipping_cost" type="number" step="0.01" placeholder="0.00" {...register('shipping_cost', { valueAsNumber: true })} />
              {errors.shipping_cost && <p className="text-sm text-destructive">{errors.shipping_cost.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total_weight_kg">Peso total (kg)</Label>
              <Input id="total_weight_kg" type="number" step="0.01" placeholder="0.00" {...register('total_weight_kg', { valueAsNumber: true })} />
              {errors.total_weight_kg && <p className="text-sm text-destructive">{errors.total_weight_kg.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notas <span className="text-muted-foreground text-xs">(opc.)</span></Label>
              <Input id="notes" placeholder="Instrucciones especiales..." {...register('notes')} />
            </div>
          </div>
        </Section>

        {/* Items */}
        <Section title="Items del envío">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: 0, quantity: 1, unit_price: 0 })}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar item
            </Button>
          </div>
          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-sm text-destructive">{errors.items.message}</p>
          )}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-md">
              Sin items. Agrega al menos uno.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground mt-7 w-5 shrink-0">{index + 1}</span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Producto</Label>
                    <Controller control={control} name={`items.${index}.product_id`} render={({ field: f }) => (
                      <Select value={f.value ? String(f.value) : ''} onValueChange={(v) => f.onChange(Number(v))}>
                        <SelectTrigger>
                          <SelectValue>{f.value ? (products.find((p) => p.id === f.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                    {errors.items?.[index]?.product_id && <p className="text-xs text-destructive">{errors.items[index]?.product_id?.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">{errors.items[index]?.quantity?.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Precio unitario</Label>
                    <Input type="number" step="0.01" placeholder="0.00" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                    {errors.items?.[index]?.unit_price && <p className="text-xs text-destructive">{errors.items[index]?.unit_price?.message}</p>}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive mt-6 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => router.push('/shipments')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear envío'}
          </Button>
        </div>
      </form>
    </div>
  )
}
