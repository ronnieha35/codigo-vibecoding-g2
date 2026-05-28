'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import SuppliersTable from './SuppliersTable'
import SupplierForm, { type SupplierFormValues } from './SupplierForm'
import SupplierDeleteDialog from './SupplierDeleteDialog'
import {
  useSupplierList,
  useSupplierDetail,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/lib/hooks/useSuppliers'
import type { SupplierList } from '@/lib/types/suppliers.types'

export default function SuppliersClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useSupplierList(page)
  const { data: editingDetail } = useSupplierDetail(editingId)
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

  const handleCreate = (values: SupplierFormValues) => {
    setFormError(null)
    createMutation.mutate(values, {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear el proveedor. Verifica los datos.'),
    })
  }

  const handleUpdate = (values: SupplierFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: values },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el proveedor. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingSupplier) return
    deleteMutation.mutate(deletingSupplier.id, {
      onSuccess: () => setDeletingSupplier(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Proveedor</Button>
      </div>

      <SuppliersTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingSupplier}
      />

      {/* Create dialog */}
      <SupplierForm
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
      <SupplierForm
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
      <SupplierDeleteDialog
        supplier={deletingSupplier}
        open={!!deletingSupplier}
        onOpenChange={(open) => { if (!open) setDeletingSupplier(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
