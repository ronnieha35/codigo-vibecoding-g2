'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import RolesTable from './RolesTable'
import RoleForm, { type RoleFormValues } from './RoleForm'
import RoleDeleteDialog from './RoleDeleteDialog'
import {
  useGroupList,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from '@/lib/hooks/useUsers'
import type { GroupItem } from '@/lib/types/users.types'

export default function RolesClient() {
  const [editingRole, setEditingRole] = useState<GroupItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingRole, setDeletingRole] = useState<GroupItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: groups = [], isLoading } = useGroupList()
  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup(editingRole?.id ?? 0)
  const deleteMutation = useDeleteGroup()

  const handleCreate = (values: RoleFormValues) => {
    setFormError(null)
    createMutation.mutate(values, {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear el rol. El nombre puede estar duplicado.'),
    })
  }

  const handleUpdate = (values: RoleFormValues) => {
    setFormError(null)
    updateMutation.mutate(values, {
      onSuccess: () => setEditingRole(null),
      onError: () => setFormError('Error al actualizar el rol.'),
    })
  }

  const handleDelete = () => {
    if (!deletingRole) return
    deleteMutation.mutate(deletingRole.id, {
      onSuccess: () => setDeletingRole(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {groups.length} rol{groups.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Nuevo Rol</Button>
      </div>

      <RolesTable
        data={groups}
        isLoading={isLoading}
        onEdit={(g) => { setFormError(null); setEditingRole(g) }}
        onDelete={setDeletingRole}
      />

      <RoleForm
        open={showCreate}
        onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        serverError={formError}
      />
      <RoleForm
        open={editingRole !== null}
        onOpenChange={(open) => { if (!open) { setEditingRole(null); setFormError(null) } }}
        defaultValues={editingRole ?? undefined}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={formError}
      />
      <RoleDeleteDialog
        role={deletingRole}
        open={!!deletingRole}
        onOpenChange={(open) => { if (!open) setDeletingRole(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
