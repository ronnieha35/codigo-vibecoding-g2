'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import CustomersTable from './CustomersTable'
import CustomerForm, { type CustomerFormValues } from './CustomerForm'
import CustomerDeleteDialog from './CustomerDeleteDialog'
import {
  useCustomerList,
  useCustomerDetail,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/lib/hooks/useCustomers'
import { useCanModule } from '@/lib/hooks/usePermissions'
import type { CustomerList } from '@/lib/types/customers.types'

const NONE = '__none__'

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'PERSON',  label: 'Persona' },
  { value: 'COMPANY', label: 'Empresa' },
]

export default function CustomersClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [customerType, setCustomerType] = useState(NONE)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [customerType])

  const clearFilters = useCallback(() => {
    setSearchInput(''); setDebouncedSearch(''); setCustomerType(NONE); setPage(1)
  }, [])

  const activeFilterCount = [debouncedSearch, customerType !== NONE].filter(Boolean).length

  const { data, isLoading } = useCustomerList(page, debouncedSearch || undefined, customerType !== NONE ? customerType : undefined)
  const { data: editingDetail } = useCustomerDetail(editingId)
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()
  const { canAdd, canChange, canDelete } = useCanModule('customers')

  const handleCreate = (values: CustomerFormValues) => {
    setFormError(null)
    createMutation.mutate(
      { ...values, tax_id: values.tax_id || null },
      {
        onSuccess: () => setShowCreate(false),
        onError: () => setFormError('Error al crear el cliente. Verifica los datos.'),
      }
    )
  }

  const handleUpdate = (values: CustomerFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: { ...values, tax_id: values.tax_id || null } },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el cliente. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingCustomer) return
    deleteMutation.mutate(deletingCustomer.id, {
      onSuccess: () => setDeletingCustomer(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Clientes</h1>
          {data?.count !== undefined && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.count} cliente{data.count !== 1 ? 's' : ''}{activeFilterCount > 0 ? ' con filtros activos' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="lg:hidden gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && <Badge variant="secondary" className="font-mono text-xs ml-0.5">{activeFilterCount}</Badge>}
          </Button>
          {canAdd && <Button onClick={() => setShowCreate(true)}>Nuevo Cliente</Button>}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar por nombre, email, ciudad..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-9 text-sm" />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={customerType} onValueChange={(v) => setCustomerType(v ?? NONE)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue>{customerType === NONE ? 'Tipo de cliente' : CUSTOMER_TYPE_OPTIONS.find(o => o.value === customerType)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos los tipos</SelectItem>
            {CUSTOMER_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                <Input placeholder="Nombre, email, ciudad..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 text-sm" />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de cliente</Label>
              <Select value={customerType} onValueChange={(v) => setCustomerType(v ?? NONE)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue>{customerType === NONE ? 'Todos los tipos' : CUSTOMER_TYPE_OPTIONS.find(o => o.value === customerType)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Todos los tipos</SelectItem>
                  {CUSTOMER_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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

      <CustomersTable data={data?.results ?? []} isLoading={isLoading} page={page} hasNextPage={!!data?.next} onPageChange={setPage} onEdit={(id) => { setFormError(null); setEditingId(id) }} onDelete={setDeletingCustomer} canEdit={canChange} canDelete={canDelete} />

      <CustomerForm open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setFormError(null) }} onSubmit={handleCreate} isPending={createMutation.isPending} serverError={formError} />
      <CustomerForm open={editingId !== null} onOpenChange={(open) => { if (!open) { setEditingId(null); setFormError(null) } }} defaultValues={editingDetail} onSubmit={handleUpdate} isPending={updateMutation.isPending} serverError={formError} />
      <CustomerDeleteDialog customer={deletingCustomer} open={!!deletingCustomer} onOpenChange={(open) => { if (!open) setDeletingCustomer(null) }} onConfirm={handleDelete} isPending={deleteMutation.isPending} />
    </div>
  )
}
