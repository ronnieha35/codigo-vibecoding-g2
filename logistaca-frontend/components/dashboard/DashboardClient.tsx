'use client'

import { useState } from 'react'
import { Package2, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard from './KPICard'
import ShipmentStatusChart from './ShipmentStatusChart'
import ShipmentsTimelineChart from './ShipmentsTimelineChart'
import RevenueTimelineChart from './RevenueTimelineChart'
import WeightBarChart from './WeightBarChart'
import TopDestinationsChart from './TopDestinationsChart'
import ShipmentsByDriverChart from './ShipmentsByDriverChart'
import { useDashboardSummary, useShipmentTimeline } from '@/lib/hooks/useAnalytics'
import type { Granularity } from '@/lib/types/analytics.types'

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  IN_TRANSIT: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
}

export default function DashboardClient() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>()
  const [appliedTo, setAppliedTo] = useState<string | undefined>()
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [driverId, setDriverId] = useState<number | undefined>()

  const summaryParams = { date_from: appliedFrom, date_to: appliedTo }
  const timelineParams = { date_from: appliedFrom, date_to: appliedTo, granularity, driver_id: driverId }

  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(summaryParams)
  const { data: timelineData, isLoading: timelineLoading } = useShipmentTimeline(timelineParams)

  const kpis = summaryData?.kpis
  const byStatus = summaryData?.by_status ?? []
  const timeline = timelineData ?? []

  const applyFilter = () => {
    setAppliedFrom(dateFrom || undefined)
    setAppliedTo(dateTo || undefined)
  }

  const clearFilter = () => {
    setDateFrom('')
    setDateTo('')
    setAppliedFrom(undefined)
    setAppliedTo(undefined)
  }

  const hasFilter = !!appliedFrom || !!appliedTo

  return (
    <div className="flex flex-col gap-6">

      {/* Header + filtros globales */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Visibilidad operativa en tiempo real</p>
        </div>
        <div className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-card sm:flex-row sm:items-end sm:flex-wrap">
          {/* Granularidad */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Agrupación</Label>
            <div className="flex h-9 rounded-md border border-border overflow-hidden text-sm">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGranularity(opt.value)}
                  className={`px-4 transition-colors cursor-pointer ${
                    granularity === opt.value
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Rango de fechas */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 self-end">
            <Button size="sm" onClick={applyFilter} className="h-9 px-5">Aplicar</Button>
            {hasFilter && (
              <Button size="sm" variant="ghost" onClick={clearFilter} className="h-9">Limpiar</Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Envíos activos"
          value={kpis?.active_shipments ?? '—'}
          subtitle="Pendientes, asignados o en tránsito"
          icon={Package2}
          loading={summaryLoading}
        />
        <KPICard
          title="Ingresos del mes"
          value={kpis ? `$${kpis.monthly_revenue.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          subtitle="Suma de costos de envío del mes actual"
          icon={TrendingUp}
          loading={summaryLoading}
        />
        <KPICard
          title="Tasa de entrega"
          value={kpis ? `${kpis.delivery_rate}%` : '—'}
          subtitle="Últimos 30 días"
          icon={CheckCircle2}
          loading={summaryLoading}
        />
        <KPICard
          title="Stock bajo"
          value={kpis?.low_stock_count ?? '—'}
          subtitle="Productos con menos de 10 unidades"
          icon={AlertTriangle}
          alert={(kpis?.low_stock_count ?? 0) > 0}
          loading={summaryLoading}
        />
      </div>

      {/* Fila 1: donut + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ShipmentStatusChart data={byStatus} loading={summaryLoading} />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Detalle por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {summaryLoading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />)
              : byStatus.length === 0
                ? <p className="text-sm text-muted-foreground">Sin datos</p>
                : byStatus.map((s) => {
                    const total = byStatus.reduce((acc, x) => acc + x.count, 0)
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                    return (
                      <div key={s.status} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#94a3b8' }} />
                            <span className="text-sm text-foreground truncate">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold font-mono">{s.count}</span>
                            <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                          />
                        </div>
                      </div>
                    )
                  })}
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: timeline de envíos (ancho completo) */}
      <ShipmentsTimelineChart data={timeline} granularity={granularity} loading={timelineLoading} />

      {/* Fila 3: ingresos + peso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RevenueTimelineChart data={timeline} granularity={granularity} loading={timelineLoading} />
        <WeightBarChart
          data={timeline}
          granularity={granularity}
          loading={timelineLoading}
          onDriverChange={(id) => setDriverId(id)}
        />
      </div>

      {/* Fila 4: top destinos + por conductor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopDestinationsChart dateFrom={appliedFrom} dateTo={appliedTo} />
        <ShipmentsByDriverChart dateFrom={appliedFrom} dateTo={appliedTo} />
      </div>

    </div>
  )
}
