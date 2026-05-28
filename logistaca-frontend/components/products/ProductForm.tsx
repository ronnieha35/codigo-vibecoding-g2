'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupplierList } from '@/lib/hooks/useSuppliers'
import { useWarehouseList } from '@/lib/hooks/useWarehouses'
import type { ProductDetail } from '@/lib/types/products.types'

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

export type ProductFormValues = z.infer<typeof schema>

const EMPTY: ProductFormValues = {
  supplier_id: 0, warehouse_id: null, name: '', sku: '',
  description: '', category: '', unit_price: 0, weight_kg: 0,
  length_cm: 0, width_cm: 0, height_cm: 0, stock_quantity: 0, is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: ProductDetail
  onSubmit: (values: ProductFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function ProductForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  const { data: suppliersData } = useSupplierList(1)
  const { data: warehousesData } = useWarehouseList(1)

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            supplier_id: defaultValues.supplier_id,
            warehouse_id: defaultValues.warehouse_id,
            name: defaultValues.name,
            sku: defaultValues.sku,
            description: defaultValues.description,
            category: defaultValues.category,
            unit_price: defaultValues.unit_price,
            weight_kg: defaultValues.weight_kg,
            length_cm: defaultValues.length_cm,
            width_cm: defaultValues.width_cm,
            height_cm: defaultValues.height_cm,
            stock_quantity: defaultValues.stock_quantity,
            is_active: defaultValues.is_active,
          }
        : EMPTY)
    }
  }, [open, defaultValues, reset])

  const suppliers = suppliersData?.results ?? []
  const warehouses = warehousesData?.results ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Proveedor</Label>
              <Controller
                control={control}
                name="supplier_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>{field.value ? (suppliers.find((s) => s.id === field.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bodega <span className="text-zinc-400">(opcional)</span></Label>
              <Controller
                control={control}
                name="warehouse_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>{field.value ? (warehouses.find((w) => w.id === field.value)?.name ?? 'Sin bodega') : 'Sin bodega'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin bodega</SelectItem>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register('sku')} />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" {...register('category')} />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit_price">Precio unitario</Label>
              <Input id="unit_price" type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} />
              {errors.unit_price && <p className="text-sm text-destructive">{errors.unit_price.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock_quantity">Stock</Label>
              <Input id="stock_quantity" type="number" {...register('stock_quantity', { valueAsNumber: true })} />
              {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input id="weight_kg" type="number" step="0.01" {...register('weight_kg', { valueAsNumber: true })} />
              {errors.weight_kg && <p className="text-sm text-destructive">{errors.weight_kg.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="length_cm">Largo (cm)</Label>
              <Input id="length_cm" type="number" step="0.01" {...register('length_cm', { valueAsNumber: true })} />
              {errors.length_cm && <p className="text-sm text-destructive">{errors.length_cm.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="width_cm">Ancho (cm)</Label>
              <Input id="width_cm" type="number" step="0.01" {...register('width_cm', { valueAsNumber: true })} />
              {errors.width_cm && <p className="text-sm text-destructive">{errors.width_cm.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="height_cm">Alto (cm)</Label>
              <Input id="height_cm" type="number" step="0.01" {...register('height_cm', { valueAsNumber: true })} />
              {errors.height_cm && <p className="text-sm text-destructive">{errors.height_cm.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Select value={field.value ? 'true' : 'false'} onValueChange={(v) => field.onChange(v === 'true')}>
                  <SelectTrigger>
                    <SelectValue>{field.value ? 'Activo' : 'Inactivo'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
