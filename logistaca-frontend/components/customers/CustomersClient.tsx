'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import type { CustomerList } from '@/lib/types/customers.types'

export default function CustomersClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useCustomerList(page)
  const { data: editingDetail } = useCustomerDetail(editingId)
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Cliente</Button>
      </div>

      <CustomersTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingCustomer}
      />

      {/* Create dialog */}
      <CustomerForm
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
      <CustomerForm
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
      <CustomerDeleteDialog
        customer={deletingCustomer}
        open={!!deletingCustomer}
        onOpenChange={(open) => { if (!open) setDeletingCustomer(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
