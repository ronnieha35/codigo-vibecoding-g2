# Suppliers Spec

**Status:** ✅ Validated

## Scope

CRUD completo de proveedores. Patrón idéntico a Warehouses.
- Página `/suppliers` con tabla paginada
- Columnas: Nombre, Email, Tax ID, Activo
- Modal crear/editar (RHF + Zod)
- Dialog confirmación eliminar
- Paginación backend `?page=N`

## shadcn components needed

Todos ya instalados (dialog, alert-dialog, badge, table, select, input, label, button).

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/suppliers.types.ts` — `SupplierList` (id,name,email,tax_id,is_active), `SupplierDetail`, `SupplierWrite`. ✓
- [x] 2. Verificar `lib/api/suppliers.api.ts` — list, get, create, update, delete. ✓

### Hooks
- [x] 3. Crear `lib/hooks/useSuppliers.ts`

### Components
- [x] 4. Crear `components/suppliers/SuppliersTable.tsx`
- [x] 5. Crear `components/suppliers/SupplierForm.tsx`
- [x] 6. Crear `components/suppliers/SupplierDeleteDialog.tsx`

### Pages
- [x] 7. Crear `app/(dashboard)/suppliers/page.tsx`
- [x] 8. Crear `components/suppliers/SuppliersClient.tsx`

## Acceptance criteria

- Tabla columnas: Nombre, Email, Tax ID, Activo (badge)
- Paginación Anterior/Siguiente
- Create/Edit/Delete funcionan e invalidan query
- Validación: email válido, tax_id único (backend), todos required
- Build limpio sin errores TS
