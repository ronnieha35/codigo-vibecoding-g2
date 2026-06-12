'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissionList } from '@/lib/hooks/useUsers'
import type { GroupItem } from '@/lib/types/users.types'

const APP_LABEL_MAP: Record<string, string> = {
  customers: 'Clientes',
  shipments: 'Envíos',
  products: 'Productos',
  transport: 'Transporte',
  drivers: 'Conductores',
  routes: 'Rutas',
  warehouses: 'Bodegas',
  suppliers: 'Proveedores',
}

const schema = z.object({
  name: z.string().min(1, 'Nombre del rol requerido'),
  permission_ids: z.array(z.number()),
})

export type RoleFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: GroupItem
  onSubmit: (values: RoleFormValues) => void
  isPending: boolean
  serverError?: string | null
}

export default function RoleForm({ open, onOpenChange, defaultValues, onSubmit, isPending, serverError }: Props) {
  const isEdit = !!defaultValues
  const { data: permissions = [] } = usePermissionList()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', permission_ids: [] },
  })

  const selectedIds = watch('permission_ids') ?? []

  useEffect(() => {
    if (open) {
      reset({
        name: defaultValues?.name ?? '',
        permission_ids: defaultValues?.permissions?.map((p) => p.id) ?? [],
      })
    }
  }, [open, defaultValues, reset])

  const grouped = useMemo(() => {
    const map: Record<string, typeof permissions> = {}
    for (const p of permissions) {
      if (!map[p.app_label]) map[p.app_label] = []
      map[p.app_label].push(p)
    }
    return map
  }, [permissions])

  const togglePermission = (id: number) => {
    setValue(
      'permission_ids',
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
      { shouldDirty: true }
    )
  }

  const toggleAll = (ids: number[], allSelected: boolean) => {
    setValue(
      'permission_ids',
      allSelected
        ? selectedIds.filter((x) => !ids.includes(x))
        : [...new Set([...selectedIds, ...ids])],
      { shouldDirty: true }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2 overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre del rol</Label>
            <Input id="name" {...register('name')} placeholder="ej: Operador, Supervisor..." />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {permissions.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Permisos</Label>
              <div className="overflow-y-auto max-h-[42vh] flex flex-col gap-3 pr-1">
                {Object.entries(grouped).map(([appLabel, perms]) => {
                  const ids = perms.map((p) => p.id)
                  const allSelected = ids.every((id) => selectedIds.includes(id))
                  return (
                    <div key={appLabel} className="rounded-md border p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {APP_LABEL_MAP[appLabel] ?? appLabel}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleAll(ids, allSelected)}
                          className="text-xs text-primary hover:underline"
                        >
                          {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`perm-${p.id}`}
                              checked={selectedIds.includes(p.id)}
                              onCheckedChange={() => togglePermission(p.id)}
                            />
                            <label htmlFor={`perm-${p.id}`} className="text-sm cursor-pointer leading-tight">
                              {p.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
