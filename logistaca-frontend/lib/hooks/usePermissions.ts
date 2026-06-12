'use client'

import { useAuthStore } from '@/lib/stores/auth.store'

const MODULE_MODELS: Record<string, string> = {
  customers: 'customers.customer',
  suppliers: 'suppliers.supplier',
  warehouses: 'warehouses.warehouse',
  products: 'products.product',
  transport: 'transport.transport',
  drivers: 'drivers.driver',
  routes: 'routes.route',
  shipments: 'shipments.shipment',
}

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const can = (perm: string): boolean => {
    if (!user) return false
    if (user.is_superuser) return true
    return (user.permissions ?? []).includes(perm)
  }

  return { can }
}

export function useCanModule(module: keyof typeof MODULE_MODELS) {
  const user = useAuthStore((s) => s.user)

  if (!user) return { canAdd: false, canChange: false, canDelete: false }
  if (user.is_superuser) return { canAdd: true, canChange: true, canDelete: true }

  const base = MODULE_MODELS[module]
  const [appLabel, modelName] = base.split('.')
  const perms = user.permissions ?? []

  return {
    canAdd: perms.includes(`${appLabel}.add_${modelName}`),
    canChange: perms.includes(`${appLabel}.change_${modelName}`),
    canDelete: perms.includes(`${appLabel}.delete_${modelName}`),
  }
}
