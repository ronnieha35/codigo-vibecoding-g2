import { Warehouse, Building2, Users, PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { title: 'Bodegas', href: '/warehouses', icon: Warehouse, description: 'Gestión de almacenes' },
  { title: 'Proveedores', href: '/suppliers', icon: Building2, description: 'Red de proveedores' },
  { title: 'Clientes', href: '/customers', icon: Users, description: 'Base de clientes' },
  { title: 'Envíos', href: '/shipments', icon: PackageCheck, description: 'Seguimiento de envíos' },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al sistema de gestión logística.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, href, icon: Icon, description }) => (
          <a key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
