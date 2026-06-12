'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/stores/auth.store'
import { deleteAuthCookie } from '@/lib/auth/cookies'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Menu, Sun, Moon, LogOut, UserCircle } from 'lucide-react'

interface Props {
  onMobileMenuOpen: () => void
}

function getInitials(user: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!user) return 'U'
  if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  if (user.first_name) return user.first_name[0].toUpperCase()
  if (user.username) return user.username.slice(0, 2).toUpperCase()
  return 'U'
}

export default function TopBar({ onMobileMenuOpen }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    deleteAuthCookie()
    router.push('/login')
  }

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : (user?.username ?? 'Usuario')

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuOpen}
        className="flex lg:hidden items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors cursor-pointer outline-none"
          aria-label="Menú de usuario"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shrink-0 select-none">
            {getInitials(user)}
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground max-w-[140px] truncate">
            {displayName}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5 py-0.5">
                <p className="text-sm font-medium leading-none text-foreground">{displayName}</p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground leading-none mt-1 truncate">{user.email}</p>
                )}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push('/profile')} className="gap-2 cursor-pointer">
            <UserCircle className="w-3.5 h-3.5" />
            <span>Mi perfil</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className={cn('gap-2 cursor-pointer')}
          >
            <LogOut className="w-3.5 h-3.5 text-destructive" />
            <span className="text-destructive">Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
