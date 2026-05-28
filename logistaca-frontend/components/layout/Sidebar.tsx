'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/stores/auth.store'
import { deleteAuthCookie } from '@/lib/auth/cookies'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Warehouse,
  Users,
  Package,
  Truck,
  UserCheck,
  MapPin,
  PackageCheck,
  LogOut,
  Building2,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/warehouses', label: 'Bodegas', icon: Warehouse },
  { href: '/suppliers', label: 'Proveedores', icon: Building2 },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/transport', label: 'Transporte', icon: Truck },
  { href: '/drivers', label: 'Conductores', icon: UserCheck },
  { href: '/routes', label: 'Rutas', icon: MapPin },
  { href: '/shipments', label: 'Envíos', icon: PackageCheck },
  { href: '/products', label: 'Productos', icon: Package },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    deleteAuthCookie()
    router.push('/login')
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-zinc-950 text-zinc-100 border-r border-zinc-800 shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-zinc-800">
        <Truck className="w-5 h-5 text-blue-400" />
        <span className="font-bold tracking-tight text-white">Logística</span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navLinks.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(href, exact)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
