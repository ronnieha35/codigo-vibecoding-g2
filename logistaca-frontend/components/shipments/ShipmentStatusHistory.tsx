'use client'

import { Badge } from '@/components/ui/badge'
import type { ShipmentStatusHistory as HistoryEntry, ShipmentStatus } from '@/lib/types/shipments.types'

interface Props {
  history: HistoryEntry[]
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

export default function ShipmentStatusHistory({ history }: Props) {
  if (!history.length) return <p className="text-sm text-muted-foreground">Sin historial de estado.</p>

  return (
    <div className="flex flex-col gap-2">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          <Badge variant={STATUS_VARIANT[entry.status]} className="shrink-0">
            {STATUS_LABEL[entry.status]}
          </Badge>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">
              {new Date(entry.changed_at).toLocaleString('es-CO')}
              {entry.changed_by ? ` · ${entry.changed_by.username}` : ''}
            </span>
            {entry.notes && <span className="text-foreground">{entry.notes}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
