'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import TransportTable from './TransportTable'
import TransportForm, { type TransportFormValues } from './TransportForm'
import TransportDeleteDialog from './TransportDeleteDialog'
import {
  useTransportList,
  useTransportDetail,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
} from '@/lib/hooks/useTransport'
import type { TransportList } from '@/lib/types/transport.types'

export default function TransportClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingTransport, setDeletingTransport] = useState<TransportList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useTransportList(page)
  const { data: editingDetail } = useTransportDetail(editingId)
  const createMutation = useCreateTransport()
  const updateMutation = useUpdateTransport()
  const deleteMutation = useDeleteTransport()

  const handleCreate = (values: TransportFormValues) => {
    setFormError(null)
    createMutation.mutate(values, {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear el vehículo. Verifica los datos.'),
    })
  }

  const handleUpdate = (values: TransportFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: values },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el vehículo. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingTransport) return
    deleteMutation.mutate(deletingTransport.id, {
      onSuccess: () => setDeletingTransport(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Vehículos</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Vehículo</Button>
      </div>

      <TransportTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingTransport}
      />

      {/* Create dialog */}
      <TransportForm
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
      <TransportForm
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
      <TransportDeleteDialog
        transport={deletingTransport}
        open={!!deletingTransport}
        onOpenChange={(open) => { if (!open) setDeletingTransport(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
