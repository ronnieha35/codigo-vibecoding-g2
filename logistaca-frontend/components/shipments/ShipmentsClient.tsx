'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import ShipmentsTable from './ShipmentsTable'
import ShipmentDeleteDialog from './ShipmentDeleteDialog'
import ShipmentStatusHistoryComponent from './ShipmentStatusHistory'
import {
  useShipmentList,
  useShipmentDetail,
  useDeleteShipment,
} from '@/lib/hooks/useShipments'
import { useCustomerList } from '@/lib/hooks/useCustomers'
import { useWarehouseList } from '@/lib/hooks/useWarehouses'
import { useProductList } from '@/lib/hooks/useProducts'
import type { ShipmentList, ShipmentStatus } from '@/lib/types/shipments.types'
import type { ShipmentFilters } from '@/lib/api/shipments.api'
import { useCanModule } from '@/lib/hooks/usePermissions'

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: 'PENDING',    label: 'Pendiente'   },
  { value: 'ASSIGNED',   label: 'Asignado'    },
  { value: 'IN_TRANSIT', label: 'En tránsito' },
  { value: 'DELIVERED',  label: 'Entregado'   },
  { value: 'CANCELLED',  label: 'Cancelado'   },
]

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente', ASSIGNED: 'Asignado',
  IN_TRANSIT: 'En tránsito', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}

const NONE = '__none__'

export default function ShipmentsClient() {
  const router = useRouter()

  // filter inputs
  const [searchInput, setSearchInput]     = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter]   = useState<string>(NONE)
  const [customerId, setCustomerId]       = useState<string>(NONE)
  const [warehouseId, setWarehouseId]     = useState<string>(NONE)
  const [productId, setProductId]         = useState<string>(NONE)
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')

  // table state
  const [filterOpen, setFilterOpen]               = useState(false)
  const [page, setPage]                           = useState(1)
  const [viewingId, setViewingId]                 = useState<number | null>(null)
  const [deletingShipment, setDeletingShipment]   = useState<ShipmentList | null>(null)

  // debounce search → reset page
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // reset page when select/date filters change
  useEffect(() => { setPage(1) }, [statusFilter, customerId, warehouseId, productId, dateFrom, dateTo])

  const filters: ShipmentFilters = {
    status:      statusFilter  !== NONE ? statusFilter as ShipmentStatus : undefined,
    customer_id: customerId    !== NONE ? Number(customerId)  : undefined,
    warehouse_id: warehouseId  !== NONE ? Number(warehouseId) : undefined,
    product_id:  productId     !== NONE ? Number(productId)   : undefined,
    search:      debouncedSearch || undefined,
    date_from:   dateFrom || undefined,
    date_to:     dateTo   || undefined,
  }

  const activeFilterCount = [
    statusFilter   !== NONE,
    customerId     !== NONE,
    warehouseId    !== NONE,
    productId      !== NONE,
    !!debouncedSearch,
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length

  const clearFilters = useCallback(() => {
    setSearchInput(''); setDebouncedSearch('')
    setStatusFilter(NONE); setCustomerId(NONE)
    setWarehouseId(NONE); setProductId(NONE)
    setDateFrom(''); setDateTo('')
    setPage(1)
  }, [])

  // data
  const { data, isLoading }         = useShipmentList(page, filters)
  const { data: viewingDetail }     = useShipmentDetail(viewingId)
  const deleteMutation              = useDeleteShipment()
  const { canAdd, canChange, canDelete } = useCanModule('shipments')

  // options for selects (page 1, large page)
  const { data: customersData }     = useCustomerList(1)
  const { data: warehousesData }    = useWarehouseList(1)
  const { data: productsData }      = useProductList(1)

  const customers  = customersData?.results  ?? []
  const warehouses = warehousesData?.results ?? []
  const products   = productsData?.results   ?? []

  const handleDelete = () => {
    if (!deletingShipment) return
    deleteMutation.mutate(deletingShipment.id, {
      onSuccess: () => setDeletingShipment(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Envíos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.count !== undefined
              ? `${data.count} envío${data.count !== 1 ? 's' : ''}${activeFilterCount > 0 ? ' con filtros activos' : ''}`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="lg:hidden gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && <Badge variant="secondary" className="font-mono text-xs ml-0.5">{activeFilterCount}</Badge>}
          </Button>
          {canAdd && <Button onClick={() => router.push('/shipments/new')}>Nuevo Envío</Button>}
        </div>
      </div>

      {/* Mobile filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Ciudad, país, dirección..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 text-sm" />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{statusFilter === NONE ? 'Todos los estados' : STATUS_LABEL[statusFilter as ShipmentStatus]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos los estados</SelectItem>
                  {STATUS_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{customerId === NONE ? 'Todos los clientes' : customers.find((c) => String(c.id) === customerId)?.name ?? 'Cliente'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos los clientes</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Producto</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{productId === NONE ? 'Todos los productos' : products.find((p) => String(p.id) === productId)?.name ?? 'Producto'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos los productos</SelectItem>
                  {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Bodega origen</Label>
              <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{warehouseId === NONE ? 'Todas las bodegas' : warehouses.find((w) => String(w.id) === warehouseId)?.name ?? 'Bodega'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todas las bodegas</SelectItem>
                  {warehouses.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>Aplicar</Button>
              {activeFilterCount > 0 && <Button variant="ghost" onClick={() => { clearFilters(); setFilterOpen(false) }}>Limpiar</Button>}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop filter bar ────────────────────────────────── */}
      <div className="hidden lg:flex flex-col gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">

        {/* Row 1: search + dates + clear */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Búsqueda general</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ciudad, país, dirección..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-9 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-9 text-sm"
            />
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground self-end"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar todo
              <Badge variant="secondary" className="font-mono text-xs ml-0.5">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* Row 2: entity selects */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Cliente */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? NONE)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {customerId === NONE
                    ? 'Todos los clientes'
                    : customers.find((c) => String(c.id) === customerId)?.name ?? 'Cliente'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos los clientes</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? NONE)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {statusFilter === NONE
                    ? 'Todos los estados'
                    : STATUS_LABEL[statusFilter as ShipmentStatus]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos los estados</SelectItem>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Producto */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Producto</Label>
            <Select value={productId} onValueChange={(v) => setProductId(v ?? NONE)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {productId === NONE
                    ? 'Todos los productos'
                    : products.find((p) => String(p.id) === productId)?.name ?? 'Producto'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos los productos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bodega */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Bodega origen</Label>
            <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? NONE)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {warehouseId === NONE
                    ? 'Todas las bodegas'
                    : warehouses.find((w) => String(w.id) === warehouseId)?.name ?? 'Bodega'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas las bodegas</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Table */}
      <ShipmentsTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => router.push(`/shipments/${id}/edit`)}
        onDelete={setDeletingShipment}
        onView={setViewingId}
        canEdit={canChange}
        canDelete={canDelete}
      />

      {/* Detail dialog */}
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
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p><span className="font-medium text-foreground">Cliente:</span> {viewingDetail.customer.name}</p>
                <p><span className="font-medium text-foreground">Destino:</span> {viewingDetail.destination_city}, {viewingDetail.destination_country}</p>
                <p><span className="font-medium text-foreground">Bodega origen:</span> {viewingDetail.origin_warehouse.name}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Items</p>
                {viewingDetail.items.map((item) => (
                  <div key={item.id} className="text-sm text-muted-foreground flex justify-between">
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
