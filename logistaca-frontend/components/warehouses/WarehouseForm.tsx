'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WarehouseDetail } from '@/lib/types/warehouses.types'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().min(1, 'País requerido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  capacity_m3: z.number().positive('Debe ser mayor a 0'),
  is_active: z.boolean(),
})

export type WarehouseFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: WarehouseDetail
  onSubmit: (values: WarehouseFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function WarehouseForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
  serverError,
}: Props) {
  const isEdit = !!defaultValues

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      capacity_m3: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        defaultValues
          ? {
              name: defaultValues.name,
              address: defaultValues.address,
              city: defaultValues.city,
              country: defaultValues.country,
              phone: defaultValues.phone,
              capacity_m3: defaultValues.capacity_m3,
              is_active: defaultValues.is_active,
            }
          : { name: '', address: '', city: '', country: '', phone: '', capacity_m3: 0, is_active: true }
      )
    }
  }, [open, defaultValues, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Bodega' : 'Nueva Bodega'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">País</Label>
              <Input id="country" {...register('country')} />
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity_m3">Capacidad (m³)</Label>
              <Input id="capacity_m3" type="number" step="0.01" {...register('capacity_m3', { valueAsNumber: true })} />
              {errors.capacity_m3 && (
                <p className="text-sm text-destructive">{errors.capacity_m3.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Select
                  value={field.value ? 'true' : 'false'}
                  onValueChange={(v) => field.onChange(v === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {serverError && (
            <p className="text-sm text-destructive text-center">{serverError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear bodega'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
