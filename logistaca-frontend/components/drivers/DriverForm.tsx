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
import { useTransportList } from '@/lib/hooks/useTransport'
import type { DriverDetail } from '@/lib/types/drivers.types'

const schema = z.object({
  user_id: z.number().positive('User ID requerido'),
  transport_id: z.number().nullable().optional(),
  license_number: z.string().min(1, 'Número de licencia requerido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  is_available: z.boolean(),
  is_active: z.boolean(),
})

export type DriverFormValues = z.infer<typeof schema>

const EMPTY: DriverFormValues = {
  user_id: 0, transport_id: null, license_number: '',
  phone: '', is_available: true, is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: DriverDetail
  onSubmit: (values: DriverFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function DriverForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<DriverFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  const { data: transportData } = useTransportList(1)
  const transports = transportData?.results ?? []

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            user_id: defaultValues.user_id,
            transport_id: defaultValues.transport_id,
            license_number: defaultValues.license_number,
            phone: defaultValues.phone,
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
          <DialogTitle>{isEdit ? 'Editar Conductor' : 'Nuevo Conductor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user_id">User ID</Label>
              <Input id="user_id" type="number" {...register('user_id', { valueAsNumber: true })} />
              {errors.user_id && <p className="text-sm text-destructive">{errors.user_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="license_number">Número de licencia</Label>
              <Input id="license_number" {...register('license_number')} />
              {errors.license_number && <p className="text-sm text-destructive">{errors.license_number.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Vehículo <span className="text-zinc-400">(opcional)</span></Label>
            <Controller
              control={control}
              name="transport_id"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : 'none'}
                  onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vehículo</SelectItem>
                    {transports.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} — {t.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Disponibilidad</Label>
              <Controller
                control={control}
                name="is_available"
                render={({ field }) => (
                  <Select value={field.value ? 'true' : 'false'} onValueChange={(v) => field.onChange(v === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear conductor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
