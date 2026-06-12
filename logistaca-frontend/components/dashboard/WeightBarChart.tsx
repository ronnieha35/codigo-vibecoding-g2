'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDriverList } from '@/lib/hooks/useDrivers'
import type { TimelinePoint, Granularity } from '@/lib/types/analytics.types'

interface Props {
  data: TimelinePoint[]
  granularity: Granularity
  loading?: boolean
  onDriverChange: (driverId: number | undefined) => void
}

function formatPeriod(period: string, granularity: Granularity) {
  if (granularity === 'month') {
    const [y, m] = period.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    return new Date(period).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
  }
  return new Date(period + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
}

export default function WeightBarChart({ data, granularity, loading, onDriverChange }: Props) {
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const { data: driversData } = useDriverList(1)
  const drivers = driversData?.results ?? []

  const chartData = data.map((d) => ({ ...d, label: formatPeriod(d.period, granularity) }))

  const handleDriverChange = (v: string | null) => {
    const val = v ?? 'all'
    setSelectedDriver(val)
    onDriverChange(val === 'all' ? undefined : Number(val))
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">Peso transportado (kg)</CardTitle>
            <p className="text-xs text-muted-foreground">Total de kg por período</p>
          </div>
          <Select value={selectedDriver} onValueChange={handleDriverChange}>
            <SelectTrigger className="w-40 h-7 text-xs">
              <SelectValue>
                {selectedDriver === 'all'
                  ? 'Todos los conductores'
                  : (() => {
                      const d = drivers.find((x) => String(x.id) === selectedDriver)
                      return d ? `${d.first_name} ${d.last_name}` : 'Seleccionar...'
                    })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los conductores</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.first_name} {d.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 bg-muted animate-pulse rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos para el período</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} unit=" kg" width={56} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', fontSize: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [`${Number(v).toLocaleString('es-GT', { minimumFractionDigits: 2 })} kg`, 'Peso']}
              />
              <Bar dataKey="weight" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
