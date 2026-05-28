'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ProductsTable from './ProductsTable'
import ProductForm, { type ProductFormValues } from './ProductForm'
import ProductDeleteDialog from './ProductDeleteDialog'
import {
  useProductList,
  useProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/lib/hooks/useProducts'
import type { ProductList } from '@/lib/types/products.types'

export default function ProductsClient() {
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<ProductList | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useProductList(page)
  const { data: editingDetail } = useProductDetail(editingId)
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const handleCreate = (values: ProductFormValues) => {
    setFormError(null)
    createMutation.mutate(
      { ...values, warehouse_id: values.warehouse_id ?? null },
      {
        onSuccess: () => setShowCreate(false),
        onError: () => setFormError('Error al crear el producto. Verifica los datos.'),
      }
    )
  }

  const handleUpdate = (values: ProductFormValues) => {
    if (!editingId) return
    setFormError(null)
    updateMutation.mutate(
      { id: editingId, data: { ...values, warehouse_id: values.warehouse_id ?? null } },
      {
        onSuccess: () => setEditingId(null),
        onError: () => setFormError('Error al actualizar el producto. Verifica los datos.'),
      }
    )
  }

  const handleDelete = () => {
    if (!deletingProduct) return
    deleteMutation.mutate(deletingProduct.id, {
      onSuccess: () => setDeletingProduct(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <Button onClick={() => setShowCreate(true)}>Nuevo Producto</Button>
      </div>

      <ProductsTable
        data={data?.results ?? []}
        isLoading={isLoading}
        page={page}
        hasNextPage={!!data?.next}
        onPageChange={setPage}
        onEdit={(id) => {
          setFormError(null)
          setEditingId(id)
        }}
        onDelete={setDeletingProduct}
      />

      {/* Create dialog */}
      <ProductForm
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
      <ProductForm
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
      <ProductDeleteDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null) }}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
