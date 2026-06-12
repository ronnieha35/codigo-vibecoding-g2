'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useTopDestinations } from '@/lib/hooks/useAnalytics'

interface Props {
  dateFrom?: string
  dateTo?: string
}

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', '#f97316', '#10b981', '#14b8a6', '#f59e0b', '#64748b']

export default function TopDestinationsChart({ dateFrom, dateTo }: Props) {
  const [countryInput, setCountryInput] = useState('')
  const [appliedCountry, setAppliedCountry] = useState<string | undefined>()

  const { data = [], isLoading } = useTopDestinations({
    date_from: dateFrom,
    date_to: dateTo,
    country: appliedCountry,
  })

  const chartData = data.map((d) => ({
    city: d.destination_city,
    country: d.destination_country,
    count: d.count,
    label: d.destination_country ? `${d.destination_city}, ${d.destination_country}` : d.destination_city,
  }))

  const apply = () => setAppliedCountry(countryInput.trim() || undefined)
  const clear = () => { setCountryInput(''); setAppliedCountry(undefined) }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold">Top ciudades de destino</CardTitle>
            <p className="text-xs text-muted-foreground">Ciudades con más envíos recibidos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="País..."
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                className="h-7 pl-7 w-32 text-xs"
              />
            </div>
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={apply}>
              <Search className="w-3.5 h-3.5" />
            </Button>
            {appliedCountry && (
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={clear}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 bg-muted animate-pulse rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 180)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="city"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', fontSize: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                formatter={(v) => [v, 'Envíos']}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload
                  return item?.label ?? label
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
