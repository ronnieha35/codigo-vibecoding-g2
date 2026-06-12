'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, X, SlidersHorizontal } from 'lucide-react'
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
import { useCanModule } from '@/lib/hooks/usePermissions'

export default function RoutesClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingRoute, setDeletingRoute] = useState<RouteList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const clearFilters = useCallback(() => {
    setSearchInput(''); setDebouncedSearch(''); setPage(1)
  }, [])

  const activeFilterCount = debouncedSearch ? 1 : 0

  const { data, isLoading } = useRouteList(page, debouncedSearch || undefined)
  const { data: editingDetail } = useRouteDetail(editingId)
  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const deleteMutation = useDeleteRoute()
  const { canAdd, canChange, canDelete } = useCanModule('routes')

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

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Rutas</h1>
          {data?.count !== undefined && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.count} ruta{data.count !== 1 ? 's' : ''}{activeFilterCount > 0 ? ' con filtros activos' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="lg:hidden gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && <Badge variant="secondary" className="font-mono text-xs ml-0.5">{activeFilterCount}</Badge>}
          </Button>
          {canAdd && <Button onClick={() => setShowCreate(true)}>Nueva Ruta</Button>}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar por nombre, descripción..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-9 text-sm" />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" /> Limpiar
          </Button>
        )}
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Nombre, descripción..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 text-sm" />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>Aplicar</Button>
              {activeFilterCount > 0 && <Button variant="ghost" onClick={() => { clearFilters(); setFilterOpen(false) }}>Limpiar</Button>}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <RoutesTable data={data?.results ?? []} isLoading={isLoading} page={page} hasNextPage={!!data?.next} onPageChange={setPage} onEdit={(id) => { setFormError(null); setEditingId(id) }} onDelete={setDeletingRoute} canEdit={canChange} canDelete={canDelete} />

      <RouteForm open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }} onSubmit={handleCreate} isPending={createMutation.isPending} serverError={formError} />
      <RouteForm open={editingId !== null} onOpenChange={(open) => { if (!open) { setEditingId(null); setFormError(null) } }} defaultValues={editingDetail} onSubmit={handleUpdate} isPending={updateMutation.isPending} serverError={formError} />
      <RouteDeleteDialog route={deletingRoute} open={!!deletingRoute} onOpenChange={(open) => { if (!open) setDeletingRoute(null) }} onConfirm={handleDelete} isPending={deleteMutation.isPending} />
    </div>
  )
}
