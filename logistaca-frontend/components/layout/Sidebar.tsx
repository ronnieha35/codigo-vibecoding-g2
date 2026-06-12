'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Building2,
  ChevronLeft,
  UserCog,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const baseNavGroups: { label: string; links: NavLink[] }[] = [
  {
    label: 'General',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Maestros',
    links: [
      { href: '/suppliers', label: 'Proveedores', icon: Building2 },
      { href: '/warehouses', label: 'Bodegas', icon: Warehouse },
      { href: '/products', label: 'Productos', icon: Package },
      { href: '/customers', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Logística',
    links: [
      { href: '/transport', label: 'Transporte', icon: Truck },
      { href: '/drivers', label: 'Conductores', icon: UserCheck },
      { href: '/routes', label: 'Rutas', icon: MapPin },
      { href: '/shipments', label: 'Envíos', icon: PackageCheck },
    ],
  },
]

const adminGroup: { label: string; links: NavLink[] } = {
  label: 'Administración',
  links: [
    { href: '/users', label: 'Usuarios', icon: UserCog },
    { href: '/roles', label: 'Roles', icon: Users },
  ],
}

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const isSuperuser = useAuthStore((s) => s.user?.is_superuser ?? false)
  const navGroups = isSuperuser ? [...baseNavGroups, adminGroup] : baseNavGroups

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-card border-r border-border',
        'fixed inset-y-0 left-0 z-50 w-[220px]',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:shrink-0',
        'lg:transition-[width] lg:duration-300',
        collapsed ? 'lg:w-[60px]' : 'lg:w-[220px]'
      )}
      aria-label="Navegación principal"
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-3 overflow-hidden">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary shrink-0">
          <Truck className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div
          className={cn(
            'ml-2.5 transition-all duration-300 overflow-hidden whitespace-nowrap',
            collapsed ? 'w-0 opacity-0 ml-0' : 'w-36 opacity-100'
          )}
        >
          <p className="text-sm font-semibold tracking-tight leading-tight">Logistaca</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Gestión logística</p>
        </div>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className={cn(
          'hidden lg:flex',
          'absolute -right-3 top-[68px] z-20',
          'items-center justify-center w-6 h-6 rounded-full',
          'bg-card border border-border shadow-sm cursor-pointer',
          'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        )}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <ChevronLeft
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        />
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-4 px-2 py-3 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                collapsed ? 'h-0 opacity-0 mb-0' : 'h-5 opacity-100 mb-1'
              )}
            >
              <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none">
                {group.label}
              </p>
            </div>

            <div className="flex flex-col gap-0.5">
              {group.links.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-all duration-150 overflow-hidden',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', active && 'text-primary')} />
                    <span
                      className={cn(
                        'whitespace-nowrap transition-all duration-300 overflow-hidden',
                        collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
