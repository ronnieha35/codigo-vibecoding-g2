# Drivers Spec

**Status:** ✅ Validated

## Scope

CRUD completo de conductores. Depende de Transport (select en formulario).
- Página `/drivers` con tabla paginada
- Columnas: Licencia, Teléfono, Vehículo, Disponible, Activo
- Modal crear/editar (RHF + Zod) con select para transport
- Dialog confirmación eliminar
- Paginación backend `?page=N`

**Complejidad especial**: `user_id` es un campo requerido que debe referenciar un Django User existente no vinculado a otro driver. El formulario usará un campo de texto numérico para ingresar el `user_id` directamente (no hay endpoint de usuarios en el frontend).

## shadcn components needed

Todos ya instalados (dialog, alert-dialog, badge, table, select, input, label, button).

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/drivers.types.ts` — `DriverList` (id, license_number, phone, is_available, is_active), `DriverDetail` (todos los campos + nested user/transport), `DriverWrite` (user_id, transport_id, license_number, phone, is_available, is_active)
- [x] 2. Verificar `lib/api/drivers.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useDrivers.ts` — useDriverList(page), useDriverDetail(id|null), useCreateDriver, useUpdateDriver, useDeleteDriver

### Components
- [x] 4. Crear `components/drivers/DriversTable.tsx` — columnas: Licencia, Teléfono, Vehículo (nombre o "—"), Disponible (badge), Activo (badge), Acciones
- [x] 5. Crear `components/drivers/DriverForm.tsx` — campos: user_id (Input numérico), transport_id (Select desde useTransportList, opcional), license_number, phone, is_available (Select), is_active (Select)
- [x] 6. Crear `components/drivers/DriverDeleteDialog.tsx` — AlertDialog con número de licencia del conductor

### Pages
- [x] 7. Crear `app/(dashboard)/drivers/page.tsx` — Server Component wrapping DriversClient
- [x] 8. Crear `components/drivers/DriversClient.tsx` — orquesta tabla + modales + estado

## Acceptance criteria

- Tabla columnas: Licencia, Teléfono, Vehículo, Disponible (badge), Activo (badge)
- Columna Vehículo muestra nombre del transport asignado o "—" si no tiene
- Select de transport carga vehículos activos desde API (useTransportList)
- user_id: número entero positivo requerido
- transport_id: opcional, puede ser null
- license_number único (validación backend)
- Create/Edit/Delete invalidan query `['drivers']`
- Edit pre-llena formulario con IDs correctos
- Build limpio sin errores TS
