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
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { GroupItem } from '@/lib/types/users.types'

interface Props {
  data: GroupItem[]
  isLoading: boolean
  onEdit: (group: GroupItem) => void
  onDelete: (group: GroupItem) => void
}

const columnHelper = createColumnHelper<GroupItem>()

export default function RolesTable({ data, isLoading, onEdit, onDelete }: Props) {
  const columns = [
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.accessor('name', { header: 'Nombre del rol' }),
    columnHelper.accessor('permissions', {
      header: 'Permisos',
      cell: (info) => {
        const perms = info.getValue() ?? []
        if (!perms.length) return <span className="text-muted-foreground text-sm">—</span>
        return <span className="text-sm text-muted-foreground">{perms.length} permiso{perms.length !== 1 ? 's' : ''}</span>
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original)}>
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

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Cargando...</div>
  if (!data.length) return <div className="py-12 text-center text-muted-foreground">No hay roles registrados.</div>

  return (
    <div className="rounded-md border overflow-x-auto">
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
  )
}
