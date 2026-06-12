import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  alert?: boolean
  loading?: boolean
}

export default function KPICard({ title, value, subtitle, icon: Icon, alert, loading }: Props) {
  return (
    <Card className={cn('border-border', alert && 'border-destructive/40')}>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
            {loading ? (
              <div className="mt-2 h-7 w-24 rounded bg-muted animate-pulse" />
            ) : (
              <p className={cn(
                'mt-1.5 text-2xl font-bold tracking-tight font-mono leading-none',
                alert ? 'text-destructive' : 'text-foreground'
              )}>
                {value}
              </p>
            )}
            {subtitle && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{subtitle}</p>
            )}
          </div>

          <div className={cn(
            'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg',
            alert ? 'bg-destructive/8 text-destructive' : 'bg-muted text-muted-foreground'
          )}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
