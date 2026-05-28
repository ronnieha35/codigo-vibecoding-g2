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
import type { TransportDetail } from '@/lib/types/transport.types'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  license_plate: z.string().min(1, 'Placa requerida'),
  vehicle_type: z.enum(['TRUCK', 'VAN', 'MOTORCYCLE', 'OTHER']),
  capacity_kg: z.number().positive('Debe ser mayor a 0'),
  capacity_m3: z.number().positive('Debe ser mayor a 0'),
  is_available: z.boolean(),
  is_active: z.boolean(),
})

export type TransportFormValues = z.infer<typeof schema>

const EMPTY: TransportFormValues = {
  name: '', license_plate: '', vehicle_type: 'TRUCK',
  capacity_kg: 0, capacity_m3: 0, is_available: true, is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: TransportDetail
  onSubmit: (values: TransportFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function TransportForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TransportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            name: defaultValues.name,
            license_plate: defaultValues.license_plate,
            vehicle_type: defaultValues.vehicle_type,
            capacity_kg: defaultValues.capacity_kg,
            capacity_m3: defaultValues.capacity_m3,
            is_available: defaultValues.is_available,
            is_active: defaultValues.is_active,
          }
        : EMPTY)
    }
  }, [open, defaultValues, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="license_plate">Placa</Label>
              <Input id="license_plate" {...register('license_plate')} />
              {errors.license_plate && <p className="text-sm text-destructive">{errors.license_plate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de vehículo</Label>
            <Controller
              control={control}
              name="vehicle_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {({ TRUCK: 'Camión', VAN: 'Furgoneta', MOTORCYCLE: 'Moto', OTHER: 'Otro' } as Record<string, string>)[field.value] ?? field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUCK">Camión</SelectItem>
                    <SelectItem value="VAN">Furgoneta</SelectItem>
                    <SelectItem value="MOTORCYCLE">Moto</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vehicle_type && <p className="text-sm text-destructive">{errors.vehicle_type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity_kg">Capacidad (kg)</Label>
              <Input id="capacity_kg" type="number" step="0.01" {...register('capacity_kg', { valueAsNumber: true })} />
              {errors.capacity_kg && <p className="text-sm text-destructive">{errors.capacity_kg.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity_m3">Capacidad (m³)</Label>
              <Input id="capacity_m3" type="number" step="0.01" {...register('capacity_m3', { valueAsNumber: true })} />
              {errors.capacity_m3 && <p className="text-sm text-destructive">{errors.capacity_m3.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Disponibilidad</Label>
              <Controller
                control={control}
                name="is_available"
                render={({ field }) => (
                  <Select value={field.value ? 'true' : 'false'} onValueChange={(v) => field.onChange(v === 'true')}>
                    <SelectTrigger>
                      <SelectValue>{field.value ? 'Disponible' : 'No disponible'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Disponible</SelectItem>
                      <SelectItem value="false">No disponible</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear vehículo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
