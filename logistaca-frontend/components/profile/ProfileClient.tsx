'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck,
  User, Mail, Lock, CalendarDays, Hash, KeyRound,
  Package, Truck, Users, MapPin, Warehouse, ShoppingCart,
  Route, BarChart3, Info,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUpdateProfile } from '@/lib/hooks/useProfile'

const schema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email('Email inválido').or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')),
  confirm_password: z.string(),
}).refine(
  (d) => !d.password || d.password === d.confirm_password,
  { message: 'Las contraseñas no coinciden', path: ['confirm_password'] }
)

type ProfileFormValues = z.infer<typeof schema>

function getInitials(user: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!user) return 'U'
  if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  if (user.first_name) return user.first_name[0].toUpperCase()
  if (user.username) return user.username.slice(0, 2).toUpperCase()
  return 'U'
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}

const MODULE_META: Record<string, { label: string; icon: React.ElementType }> = {
  customers:  { label: 'Clientes',      icon: Users },
  shipments:  { label: 'Envíos',        icon: Package },
  products:   { label: 'Productos',     icon: ShoppingCart },
  transport:  { label: 'Transporte',    icon: Truck },
  drivers:    { label: 'Conductores',   icon: User },
  routes:     { label: 'Rutas',         icon: Route },
  warehouses: { label: 'Almacenes',     icon: Warehouse },
  suppliers:  { label: 'Proveedores',   icon: MapPin },
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', add: 'Crear', change: 'Editar', delete: 'Eliminar',
}

function parsePermissions(permissions: string[]) {
  const modules: Record<string, Set<string>> = {}
  for (const perm of permissions) {
    const [app, codename] = perm.split('.')
    if (!app || !codename) continue
    const action = Object.keys(ACTION_LABELS).find((a) => codename.startsWith(a))
    if (!action) continue
    if (!modules[app]) modules[app] = new Set()
    modules[app].add(action)
  }
  return modules
}

export default function ProfileClient() {
  const user = useAuthStore((s) => s.user)
  const mutation = useUpdateProfile()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  })

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: '',
        confirm_password: '',
      })
    }
  }, [user, reset])

  const onSubmit = (values: ProfileFormValues) => {
    mutation.mutate({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      password: values.password || undefined,
    })
  }

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : user?.username ?? 'Usuario'

  const permModules = parsePermissions(user?.permissions ?? [])
  const hasPermissions = user?.is_superuser || Object.keys(permModules).length > 0

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-mono">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu información personal y seguridad</p>
      </div>

      {/* ── Identity card ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold select-none shadow-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {getInitials(user)}
              </div>
              {user?.is_superuser && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center ring-2 ring-background">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div>
                <p className="text-lg font-semibold leading-tight truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground font-mono">@{user?.username}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {user?.is_superuser && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Superadmin
                  </Badge>
                )}
                {user?.is_active !== false
                  ? <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400 border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Activo
                    </Badge>
                  : <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      Inactivo
                    </Badge>
                }
                {!user?.is_superuser && user?.groups?.map((g) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                ))}
                {!user?.is_superuser && (!user?.groups || user.groups.length === 0) && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Sin rol asignado</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Account metadata row */}
          <div className="mt-5 pt-4 border-t grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" /> ID de cuenta
              </p>
              <p className="text-sm font-mono font-medium">{user?.id ?? '—'}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Miembro desde
              </p>
              <p className="text-sm font-medium">{formatDate(user?.date_joined)}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Permisos
              </p>
              <p className="text-sm font-medium">
                {user?.is_superuser
                  ? 'Acceso total'
                  : `${user?.permissions?.length ?? 0} permisos`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Access / Permissions card ──────────────────────────── */}
      {hasPermissions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Acceso a módulos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.is_superuser ? (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-destructive/5 border border-destructive/15 text-sm">
                <ShieldCheck className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-muted-foreground">Superadmin tiene acceso completo a todos los módulos del sistema.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {Object.entries(MODULE_META).map(([key, meta]) => {
                  const actions = permModules[key]
                  const hasAccess = !!actions && actions.size > 0
                  const Icon = meta.icon
                  return (
                    <div
                      key={key}
                      className={`flex flex-col gap-1.5 p-3 rounded-lg border transition-colors ${
                        hasAccess
                          ? 'bg-primary/5 border-primary/15'
                          : 'bg-muted/30 border-border opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${hasAccess ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-medium truncate">{meta.label}</span>
                      </div>
                      {hasAccess ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(actions).map((a) => (
                            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {ACTION_LABELS[a]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sin acceso</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Personal info form ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Read-only username hint */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/60">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Usuario: <span className="font-mono font-medium text-foreground">@{user?.username}</span>
                {' '}— el nombre de usuario no se puede cambiar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input id="first_name" placeholder="Tu nombre" {...register('first_name')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" placeholder="Tu apellido" {...register('last_name')} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Password section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Cambiar contraseña</p>
                <span className="text-xs text-muted-foreground">(dejar vacío para no cambiar)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                      className="pr-10"
                      {...register('confirm_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {mutation.isSuccess && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Perfil actualizado correctamente.
              </div>
            )}
            {mutation.isError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Error al actualizar el perfil. Verifica los datos.
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={mutation.isPending || !isDirty} className="min-w-[140px]">
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Guardando...
                  </span>
                ) : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
