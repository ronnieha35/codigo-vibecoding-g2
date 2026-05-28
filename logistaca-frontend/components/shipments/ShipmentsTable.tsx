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
import { Pencil, Trash2, Eye } from 'lucide-react'
import type { ShipmentList, ShipmentStatus } from '@/lib/types/shipments.types'

interface Props {
  data: ShipmentList[]
  isLoading: boolean
  page: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
  onEdit: (id: number) => void
  onDelete: (shipment: ShipmentList) => void
  onView: (id: number) => void
}

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<ShipmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  ASSIGNED: 'outline',
  IN_TRANSIT: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
}

const columnHelper = createColumnHelper<ShipmentList>()

export default function ShipmentsTable({
  data,
  isLoading,
  page,
  hasNextPage,
  onPageChange,
  onEdit,
  onDelete,
  onView,
}: Props) {
  const columns = [
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.accessor('customer', {
      header: 'Cliente',
      cell: (info) => info.getValue().name,
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: (info) => (
        <Badge variant={STATUS_VARIANT[info.getValue()]}>
          {STATUS_LABEL[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.accessor('destination_city', { header: 'Ciudad destino' }),
    columnHelper.accessor('scheduled_date', { header: 'Fecha programada' }),
    columnHelper.accessor('shipping_cost', {
      header: 'Costo',
      cell: (info) => `$${Number(info.getValue()).toFixed(2)}`,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView(info.row.original.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original.id)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(info.row.original)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (isLoading) return <div className="py-12 text-center text-zinc-400">Cargando...</div>
  if (!data.length) return <div className="py-12 text-center text-zinc-400">No hay envíos registrados.</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
        <span className="text-sm text-zinc-500">Página {page}</span>
        <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
      </div>
    </div>
  )
}
