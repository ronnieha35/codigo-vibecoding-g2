'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useShipmentsByDriver } from '@/lib/hooks/useAnalytics'

interface Props {
  dateFrom?: string
  dateTo?: string
}

const BAR_COLOR = '#10b981'

export default function ShipmentsByDriverChart({ dateFrom, dateTo }: Props) {
  const { data = [], isLoading } = useShipmentsByDriver({ date_from: dateFrom, date_to: dateTo })

  const chartData = data.map((d) => ({
    name: d.driver_name,
    count: d.count,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Envíos por conductor</CardTitle>
        <p className="text-xs text-muted-foreground">Cantidad de envíos asignados a cada conductor</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 bg-muted animate-pulse rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
            Sin conductores con envíos asignados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 200)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', fontSize: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [v, 'Envíos']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28} fill={BAR_COLOR}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: 'var(--foreground)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
