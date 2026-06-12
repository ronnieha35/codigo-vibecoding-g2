'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StatusCount } from '@/lib/types/analytics.types'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  IN_TRANSIT: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
}

interface Props {
  data: StatusCount[]
  loading?: boolean
}

export default function ShipmentStatusChart({ data, loading }: Props) {
  const total = data.reduce((acc, d) => acc + d.count, 0)

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Envíos por estado</CardTitle>
        <p className="text-xs text-muted-foreground">{total} envíos en total</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-muted animate-pulse" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                nameKey="label"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value]}
                contentStyle={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
