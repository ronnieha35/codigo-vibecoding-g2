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
import type { CustomerDetail } from '@/lib/types/customers.types'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  customer_type: z.enum(['PERSON', 'COMPANY']),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().min(1, 'País requerido'),
  tax_id: z.string().nullable().optional(),
  is_active: z.boolean(),
})

export type CustomerFormValues = z.infer<typeof schema>

const EMPTY: CustomerFormValues = {
  name: '', customer_type: 'PERSON', email: '', phone: '',
  address: '', city: '', country: '', tax_id: null, is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: CustomerDetail
  onSubmit: (values: CustomerFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function CustomerForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues
        ? {
            name: defaultValues.name,
            customer_type: defaultValues.customer_type,
            email: defaultValues.email,
            phone: defaultValues.phone,
            address: defaultValues.address,
            city: defaultValues.city,
            country: defaultValues.country,
            tax_id: defaultValues.tax_id,
            is_active: defaultValues.is_active,
          }
        : EMPTY)
    }
  }, [open, defaultValues, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="customer_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue>{field.value === 'PERSON' ? 'Persona' : 'Empresa'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSON">Persona</SelectItem>
                      <SelectItem value="COMPANY">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customer_type && <p className="text-sm text-destructive">{errors.customer_type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
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
              <Label htmlFor="tax_id">Tax ID <span className="text-zinc-400">(opcional)</span></Label>
              <Input id="tax_id" {...register('tax_id')} />
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
