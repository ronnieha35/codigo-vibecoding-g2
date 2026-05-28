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
import { useWarehouseList } from '@/lib/hooks/useWarehouses'
import type { RouteDetail } from '@/lib/types/routes.types'

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

export type RouteFormValues = z.infer<typeof schema>

const EMPTY: RouteFormValues = {
  name: '', origin_warehouse_id: 0, description: '',
  estimated_duration_hours: 0, is_active: true, stops: [],
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: RouteDetail
  onSubmit: (values: RouteFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function RouteForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RouteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' })
  const { data: warehousesData } = useWarehouseList(1)
  const warehouses = warehousesData?.results ?? []

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            name: defaultValues.name,
            origin_warehouse_id: defaultValues.origin_warehouse_id,
            description: defaultValues.description,
            estimated_duration_hours: defaultValues.estimated_duration_hours,
            is_active: defaultValues.is_active,
            stops: defaultValues.stops.map((s) => ({
              warehouse_id: s.warehouse.id,
              estimated_duration_minutes: s.estimated_duration_minutes,
            })),
          }
        : EMPTY)
    }
  }, [open, defaultValues, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Ruta' : 'Nueva Ruta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bodega origen</Label>
              <Controller
                control={control}
                name="origin_warehouse_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>{field.value ? (warehouses.find((w) => w.id === field.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.origin_warehouse_id && <p className="text-sm text-destructive">{errors.origin_warehouse_id.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estimated_duration_hours">Duración estimada (hrs)</Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                step="0.5"
                {...register('estimated_duration_hours', { valueAsNumber: true })}
              />
              {errors.estimated_duration_hours && <p className="text-sm text-destructive">{errors.estimated_duration_hours.message}</p>}
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
          </div>

          {/* Stops */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Paradas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ warehouse_id: 0, estimated_duration_minutes: 30 })}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar parada
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-2">Sin paradas. Agrega al menos una.</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                <span className="text-sm font-medium text-zinc-500 mt-2 w-4">{index + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Bodega</Label>
                    <Controller
                      control={control}
                      name={`stops.${index}.warehouse_id`}
                      render={({ field: f }) => (
                        <Select
                          value={f.value ? String(f.value) : ''}
                          onValueChange={(v) => f.onChange(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue>{f.value ? (warehouses.find((w) => w.id === f.value)?.name ?? 'Seleccionar...') : 'Seleccionar...'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.stops?.[index]?.warehouse_id && (
                      <p className="text-xs text-destructive">{errors.stops[index]?.warehouse_id?.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Duración (min)</Label>
                    <Input
                      type="number"
                      {...register(`stops.${index}.estimated_duration_minutes`, { valueAsNumber: true })}
                    />
                    {errors.stops?.[index]?.estimated_duration_minutes && (
                      <p className="text-xs text-destructive">{errors.stops[index]?.estimated_duration_minutes?.message}</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive mt-1"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear ruta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
