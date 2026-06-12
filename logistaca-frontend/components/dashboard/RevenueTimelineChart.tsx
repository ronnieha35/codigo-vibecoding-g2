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

function formatRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

export default function RevenueTimelineChart({ data, granularity, loading }: Props) {
  const chartData = data.map((d) => ({ ...d, label: formatPeriod(d.period, granularity) }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Ingresos en el tiempo</CardTitle>
        <p className="text-xs text-muted-foreground">Suma de costos de envío por período</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 bg-muted animate-pulse rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos para el período</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={formatRevenue} width={52} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', fontSize: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [`$${Number(v).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, 'Ingresos']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
