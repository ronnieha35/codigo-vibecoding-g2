'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import UsersTable from './UsersTable'
import UserForm, { type UserFormValues } from './UserForm'
import UserDeleteDialog from './UserDeleteDialog'
import {
  useUserList,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/lib/hooks/useUsers'
import { usersApi } from '@/lib/api/users.api'
import { useQuery } from '@tanstack/react-query'
import type { UserDetail, UserList } from '@/lib/types/users.types'

export default function UsersClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useUserList(page)
  const { data: editingDetail } = useQuery<UserDetail>({
    queryKey: ['users', editingId],
    queryFn: () => usersApi.get(editingId!).then((r) => r.data),
    enabled: editingId !== null,
  })

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(editingId ?? 0)
  const deleteMutation = useDeleteUser()

  const handleCreate = (values: UserFormValues) => {
    setFormError(null)
    const payload = {
      ...values,
      email: values.email || '',
      password: values.password || '',
      groups: values.groups,
    }
    createMutation.mutate(payload, {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear el usuario. Verifica los datos.'),
    })
  }

  const handleUpdate = (values: UserFormValues) => {
    if (!editingId) return
    setFormError(null)
    const payload: Partial<typeof values> = { ...values, email: values.email || '' }
    if (!payload.password) delete payload.password
    updateMutation.mutate(payload, {
      onSuccess: () => setEditingId(null),
      onError: () => setFormError('Error al actualizar el usuario. Verifica los datos.'),
    })
  }

  const handleDelete = () => {
    if (!deletingUser) return
    deleteMutation.mutate(deletingUser.id, {
      onSuccess: () => setDeletingUser(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Usuarios</h1>
          {data?.count !== undefined && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.count} usuario{data.count !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>Nuevo Usuario</Button>
      </div>

      <UsersTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => { setFormError(null); setEditingId(id) }}
        onDelete={setDeletingUser}
      />

      <UserForm
        open={showCreate}
        onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        serverError={formError}
      />
      <UserForm
        open={editingId !== null}
        onOpenChange={(open) => { if (!open) { setEditingId(null); setFormError(null) } }}
        defaultValues={editingDetail}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={formError}
      />
      <UserDeleteDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => { if (!open) setDeletingUser(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
