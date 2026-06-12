'use client'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { WarehouseList } from '@/lib/types/warehouses.types'

interface Props {
  data: WarehouseList[]
  isLoading: boolean
  page: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
  onEdit: (id: number) => void
  onDelete: (warehouse: WarehouseList) => void
  canEdit?: boolean
  canDelete?: boolean
}

const columnHelper = createColumnHelper<WarehouseList>()

export default function WarehousesTable({
  data,
  isLoading,
  page,
  hasNextPage,
  onPageChange,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: Props) {
  const columns = [
    columnHelper.accessor('name', { header: 'Nombre' }),
    columnHelper.accessor('city', { header: 'Ciudad' }),
    columnHelper.accessor('country', { header: 'País' }),
    columnHelper.accessor('is_active', {
      header: 'Estado',
      cell: (info) =>
        info.getValue() ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    }),
    ...(canEdit || canDelete ? [columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original.id)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(info.row.original)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    })] : []),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Cargando...</div>
  }

  if (!data.length) {
    return <div className="py-12 text-center text-muted-foreground">No hay bodegas registradas.</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
