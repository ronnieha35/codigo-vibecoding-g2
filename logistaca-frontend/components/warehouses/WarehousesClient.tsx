'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WarehousesTable from './WarehousesTable'
import WarehouseForm, { type WarehouseFormValues } from './WarehouseForm'
import WarehouseDeleteDialog from './WarehouseDeleteDialog'
import {
  useWarehouseList,
  useWarehouseDetail,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from '@/lib/hooks/useWarehouses'
import type { WarehouseList } from '@/lib/types/warehouses.types'

export default function WarehousesClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useWarehouseList(page)
  const { data: editingDetail } = useWarehouseDetail(editingId)
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const deleteMutation = useDeleteWarehouse()

  const handleCreate = (values: WarehouseFormValues) => {
    setFormError(null)
    createMutation.mutate(values, {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear la bodega. Verifica los datos.'),
    })
  }

  const handleUpdate = (values: WarehouseFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: values },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar la bodega. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingWarehouse) return
    deleteMutation.mutate(deletingWarehouse.id, {
      onSuccess: () => setDeletingWarehouse(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bodegas</h1>
        <Button onClick={() => setShowCreate(true)}>Nueva Bodega</Button>
      </div>

      <WarehousesTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingWarehouse}
      />

      {/* Create dialog */}
      <WarehouseForm
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
      <WarehouseForm
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
      <WarehouseDeleteDialog
        warehouse={deletingWarehouse}
        open={!!deletingWarehouse}
        onOpenChange={(open) => { if (!open) setDeletingWarehouse(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
