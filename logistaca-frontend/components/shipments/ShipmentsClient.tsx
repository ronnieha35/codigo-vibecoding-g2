'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import ShipmentsTable from './ShipmentsTable'
import ShipmentForm, { type ShipmentFormValues } from './ShipmentForm'
import ShipmentDeleteDialog from './ShipmentDeleteDialog'
import ShipmentStatusHistoryComponent from './ShipmentStatusHistory'
import {
  useShipmentList,
  useShipmentDetail,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
} from '@/lib/hooks/useShipments'
import type { ShipmentList, ShipmentStatus } from '@/lib/types/shipments.types'

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export default function ShipmentsClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingShipment, setDeletingShipment] = useState<ShipmentList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useShipmentList(page)
  const { data: editingDetail } = useShipmentDetail(editingId)
  const { data: viewingDetail } = useShipmentDetail(viewingId)
  const createMutation = useCreateShipment()
  const updateMutation = useUpdateShipment()
  const deleteMutation = useDeleteShipment()

  const handleCreate = (values: ShipmentFormValues) => {
    setFormError(null)
    createMutation.mutate(
      { ...values, driver_id: values.driver_id ?? null, transport_id: values.transport_id ?? null, route_id: values.route_id ?? null },
      {
        onSuccess: () => setShowCreate(false),
        onError: () => setFormError('Error al crear el envío. Verifica los datos.'),
      }
    )
  }

  const handleUpdate = (values: ShipmentFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      {
        id: editingId,
        data: { ...values, driver_id: values.driver_id ?? null, transport_id: values.transport_id ?? null, route_id: values.route_id ?? null },
      },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el envío. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingShipment) return
    deleteMutation.mutate(deletingShipment.id, {
      onSuccess: () => setDeletingShipment(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Envíos</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Envío</Button>
      </div>

      <ShipmentsTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => { setFormError(null); setEditingId(id) }}
        onDelete={setDeletingShipment}
        onView={setViewingId}
      />

      {/* Create dialog */}
      <ShipmentForm
        open={showCreate}
        onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        serverError={formError}
      />

      {/* Edit dialog */}
      <ShipmentForm
        open={editingId !== null}
        onOpenChange={(open) => { if (!open) { setEditingId(null); setFormError(null) } }}
        defaultValues={editingDetail}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={formError}
      />

      {/* Detail / history dialog */}
      <Dialog open={viewingId !== null} onOpenChange={(open) => { if (!open) setViewingId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Envío #{viewingDetail?.id}
              {viewingDetail && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {STATUS_LABEL[viewingDetail.status]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingDetail && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="text-sm text-zinc-600">
                <p><span className="font-medium">Cliente:</span> {viewingDetail.customer.name}</p>
                <p><span className="font-medium">Destino:</span> {viewingDetail.destination_city}, {viewingDetail.destination_country}</p>
                <p><span className="font-medium">Bodega origen:</span> {viewingDetail.origin_warehouse.name}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Items</p>
                {viewingDetail.items.map((item) => (
                  <div key={item.id} className="text-sm text-zinc-600 flex justify-between">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>${Number(item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Historial de estado</p>
                <ShipmentStatusHistoryComponent history={viewingDetail.status_history} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <ShipmentDeleteDialog
        shipment={deletingShipment}
        open={!!deletingShipment}
        onOpenChange={(open) => { if (!open) setDeletingShipment(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
