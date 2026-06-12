'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimelinePoint, Granularity } from '@/lib/types/analytics.types'

interface Props {
  data: TimelinePoint[]
  granularity: Granularity
  loading?: boolean
}

function formatPeriod(period: string, granularity: Granularity) {
  if (granularity === 'month') {
    const [y, m] = period.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    return `Sem. ${new Date(period).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })}`
  }
  return new Date(period + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
}

export default function ShipmentsTimelineChart({ data, granularity, loading }: Props) {
  const chartData = data.map((d) => ({ ...d, label: formatPeriod(d.period, granularity) }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Envíos en el tiempo</CardTitle>
        <p className="text-xs text-muted-foreground">Cantidad de envíos creados por período</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 bg-muted animate-pulse rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos para el período</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', fontSize: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [v, 'Envíos']}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
