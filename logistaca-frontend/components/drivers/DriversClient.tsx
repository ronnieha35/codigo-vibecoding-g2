'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DriversTable from './DriversTable'
import DriverForm, { type DriverFormValues } from './DriverForm'
import DriverDeleteDialog from './DriverDeleteDialog'
import {
  useDriverList,
  useDriverDetail,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from '@/lib/hooks/useDrivers'
import type { DriverList } from '@/lib/types/drivers.types'

export default function DriversClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingDriver, setDeletingDriver] = useState<DriverList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useDriverList(page)
  const { data: editingDetail } = useDriverDetail(editingId)
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const deleteMutation = useDeleteDriver()

  const handleCreate = (values: DriverFormValues) => {
    setFormError(null)
    createMutation.mutate(
      { ...values, transport_id: values.transport_id ?? null },
      {
        onSuccess: () => setShowCreate(false),
        onError: () => setFormError('Error al crear el conductor. Verifica los datos.'),
      }
    )
  }

  const handleUpdate = (values: DriverFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: { ...values, transport_id: values.transport_id ?? null } },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el conductor. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingDriver) return
    deleteMutation.mutate(deletingDriver.id, {
      onSuccess: () => setDeletingDriver(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Conductores</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Conductor</Button>
      </div>

      <DriversTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingDriver}
      />

      {/* Create dialog */}
      <DriverForm
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) setFormError(null)
        }}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        serverError={formError}
      />

      {/* Edit dialog */}
      <DriverForm
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
            setFormError(null)
          }
        }}
        defaultValues={editingDetail}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={formError}
      />

      {/* Delete dialog */}
      <DriverDeleteDialog
        driver={deletingDriver}
        open={!!deletingDriver}
        onOpenChange={(open) => { if (!open) setDeletingDriver(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
