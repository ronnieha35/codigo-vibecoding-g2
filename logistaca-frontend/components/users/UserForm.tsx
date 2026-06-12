'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGroupList } from '@/lib/hooks/useUsers'
import type { UserDetail } from '@/lib/types/users.types'

const schema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  email: z.string().email('Email inválido').or(z.literal('')),
  first_name: z.string(),
  last_name: z.string(),
  password: z.string().optional(),
  is_active: z.boolean(),
  groups: z.array(z.number()),
})

export type UserFormValues = z.infer<typeof schema>

const EMPTY: UserFormValues = {
  username: '', email: '', first_name: '', last_name: '',
  password: '', is_active: true, groups: [],
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: UserDetail
  onSubmit: (values: UserFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function UserForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { data: availableGroups = [] } = useGroupList()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    reset(
      defaultValues
        ? {
            username: defaultValues.username,
            email: defaultValues.email,
            first_name: defaultValues.first_name,
            last_name: defaultValues.last_name,
            password: '',
            is_active: defaultValues.is_active,
            groups: defaultValues.groups.map((g) => g.id),
          }
        : EMPTY
    )
  }, [open, defaultValues, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" {...register('username')} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email <span className="text-muted-foreground">(opcional)</span></Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" {...register('first_name')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last_name">Apellido</Label>
              <Input id="last_name" {...register('last_name')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">
                Contraseña
                {isEdit && <span className="text-muted-foreground text-xs"> (vacío = sin cambio)</span>}
              </Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
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

          {availableGroups.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Roles</Label>
              <Controller
                control={control}
                name="groups"
                render={({ field }) => (
                  <div className="rounded-md border p-3 flex flex-col gap-2">
                    {availableGroups.map((g) => {
                      const checked = field.value.includes(g.id)
                      return (
                        <div key={g.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`group-${g.id}`}
                            checked={checked}
                            onCheckedChange={() =>
                              field.onChange(
                                checked
                                  ? field.value.filter((id) => id !== g.id)
                                  : [...field.value, g.id]
                              )
                            }
                          />
                          <label htmlFor={`group-${g.id}`} className="text-sm cursor-pointer">
                            {g.name}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              />
            </div>
          )}

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
