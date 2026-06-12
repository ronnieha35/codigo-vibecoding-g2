'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
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
import { useCanModule } from '@/lib/hooks/usePermissions'

const NONE = '__none__'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'TRUCK',      label: 'Camión'  },
  { value: 'VAN',        label: 'Van'     },
  { value: 'MOTORCYCLE', label: 'Moto'    },
  { value: 'OTHER',      label: 'Otro'    },
]

export default function TransportClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingTransport, setDeletingTransport] = useState<TransportList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [vehicleType, setVehicleType] = useState(NONE)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [vehicleType])

  const clearFilters = useCallback(() => {
    setSearchInput(''); setDebouncedSearch(''); setVehicleType(NONE); setPage(1)
  }, [])

  const activeFilterCount = [debouncedSearch, vehicleType !== NONE].filter(Boolean).length

  const { data, isLoading } = useTransportList(page, debouncedSearch || undefined, vehicleType !== NONE ? vehicleType : undefined)
  const { data: editingDetail } = useTransportDetail(editingId)
  const createMutation = useCreateTransport()
  const updateMutation = useUpdateTransport()
  const deleteMutation = useDeleteTransport()
  const { canAdd, canChange, canDelete } = useCanModule('transport')

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

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Vehículos</h1>
          {data?.count !== undefined && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.count} vehículo{data.count !== 1 ? 's' : ''}{activeFilterCount > 0 ? ' con filtros activos' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="lg:hidden gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && <Badge variant="secondary" className="font-mono text-xs ml-0.5">{activeFilterCount}</Badge>}
          </Button>
          {canAdd && <Button onClick={() => setShowCreate(true)}>Nuevo Vehículo</Button>}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar por placa, marca, modelo..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-9 text-sm" />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? NONE)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue>{vehicleType === NONE ? 'Tipo de vehículo' : VEHICLE_TYPE_OPTIONS.find(o => o.value === vehicleType)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos los tipos</SelectItem>
            {VEHICLE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
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
                <Input placeholder="Placa, marca, modelo..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 text-sm" />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de vehículo</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{vehicleType === NONE ? 'Todos los tipos' : VEHICLE_TYPE_OPTIONS.find(o => o.value === vehicleType)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos los tipos</SelectItem>
                  {VEHICLE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>Aplicar</Button>
              {activeFilterCount > 0 && <Button variant="ghost" onClick={() => { clearFilters(); setFilterOpen(false) }}>Limpiar</Button>}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TransportTable data={data?.results ?? []} isLoading={isLoading} page={page} hasNextPage={!!data?.next} onPageChange={setPage} onEdit={(id) => { setFormError(null); setEditingId(id) }} onDelete={setDeletingTransport} canEdit={canChange} canDelete={canDelete} />

      <TransportForm open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }} onSubmit={handleCreate} isPending={createMutation.isPending} serverError={formError} />
      <TransportForm open={editingId !== null} onOpenChange={(open) => { if (!open) { setEditingId(null); setFormError(null) } }} defaultValues={editingDetail} onSubmit={handleUpdate} isPending={updateMutation.isPending} serverError={formError} />
      <TransportDeleteDialog transport={deletingTransport} open={!!deletingTransport} onOpenChange={(open) => { if (!open) setDeletingTransport(null) }} onConfirm={handleDelete} isPending={deleteMutation.isPending} />
    </div>
  )
}
