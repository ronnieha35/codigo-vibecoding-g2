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
import type { DriverList } from '@/lib/types/drivers.types'

interface Props {
  data: DriverList[]
  isLoading: boolean
  page: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
  onEdit: (id: number) => void
  onDelete: (driver: DriverList) => void
}

const columnHelper = createColumnHelper<DriverList>()

export default function DriversTable({
  data,
  isLoading,
  page,
  hasNextPage,
  onPageChange,
  onEdit,
  onDelete,
}: Props) {
  const columns = [
    columnHelper.accessor('license_number', { header: 'Licencia' }),
    columnHelper.accessor('phone', { header: 'Teléfono' }),
    columnHelper.accessor('is_available', {
      header: 'Disponible',
      cell: (info) =>
        info.getValue() ? (
          <Badge variant="default">Disponible</Badge>
        ) : (
          <Badge variant="secondary">No disponible</Badge>
        ),
    }),
    columnHelper.accessor('is_active', {
      header: 'Estado',
      cell: (info) =>
        info.getValue() ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex gap-2">
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
  if (!data.length) return <div className="py-12 text-center text-zinc-400">No hay conductores registrados.</div>

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
