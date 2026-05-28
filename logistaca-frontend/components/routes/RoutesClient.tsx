'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import RoutesTable from './RoutesTable'
import RouteForm, { type RouteFormValues } from './RouteForm'
import RouteDeleteDialog from './RouteDeleteDialog'
import {
  useRouteList,
  useRouteDetail,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
} from '@/lib/hooks/useRoutes'
import type { RouteList } from '@/lib/types/routes.types'

export default function RoutesClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingRoute, setDeletingRoute] = useState<RouteList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useRouteList(page)
  const { data: editingDetail } = useRouteDetail(editingId)
  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const deleteMutation = useDeleteRoute()

  const withStopOrder = (values: RouteFormValues) => ({
    ...values,
    stops: values.stops.map((s, i) => ({ ...s, stop_order: i + 1 })),
  })

  const handleCreate = (values: RouteFormValues) => {
    setFormError(null)
    createMutation.mutate(withStopOrder(values), {
      onSuccess: () => setShowCreate(false),
      onError: () => setFormError('Error al crear la ruta. Verifica los datos.'),
    })
  }

  const handleUpdate = (values: RouteFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: withStopOrder(values) },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar la ruta. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingRoute) return
    deleteMutation.mutate(deletingRoute.id, {
      onSuccess: () => setDeletingRoute(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rutas</h1>
        <Button onClick={() => setShowCreate(true)}>Nueva Ruta</Button>
      </div>

      <RoutesTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingRoute}
      />

      {/* Create dialog */}
      <RouteForm
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
      <RouteForm
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
      <RouteDeleteDialog
        route={deletingRoute}
        open={!!deletingRoute}
        onOpenChange={(open) => { if (!open) setDeletingRoute(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
