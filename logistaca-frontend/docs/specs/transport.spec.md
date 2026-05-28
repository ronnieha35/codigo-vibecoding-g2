# Transport Spec

**Status:** ✅ Validated

## Scope

CRUD completo de vehículos de transporte. Patrón idéntico a Warehouses/Suppliers.
- Página `/transport` con tabla paginada
- Columnas: Nombre, Placa, Tipo, Disponible, Activo
- Modal crear/editar (RHF + Zod)
- Dialog confirmación eliminar
- Paginación backend `?page=N`
- `vehicle_type`: enum `TRUCK | VAN | MOTORCYCLE | OTHER` → Select en formulario
- `capacity_kg` y `capacity_m3`: numéricos > 0 (`z.number().positive()` + `valueAsNumber: true`)
- `is_available` y `is_active`: ambos booleans → Select en formulario

## shadcn components needed

Todos ya instalados (dialog, alert-dialog, badge, table, select, input, label, button).

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/transport.types.ts` — `TransportList` (id, name, license_plate, vehicle_type, is_available, is_active), `TransportDetail` (todos los campos), `TransportWrite`
- [x] 2. Verificar `lib/api/transport.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useTransport.ts` — useTransportList(page), useTransportDetail(id|null), useCreateTransport, useUpdateTransport, useDeleteTransport

### Components
- [x] 4. Crear `components/transport/TransportTable.tsx` — columnas: Nombre, Placa, Tipo (badge), Disponible (badge), Activo (badge), Acciones
- [x] 5. Crear `components/transport/TransportForm.tsx` — campos: name, license_plate, vehicle_type (Select), capacity_kg (number), capacity_m3 (number), is_available (Select), is_active (Select)
- [x] 6. Crear `components/transport/TransportDeleteDialog.tsx` — AlertDialog con nombre del vehículo

### Pages
- [x] 7. Crear `app/(dashboard)/transport/page.tsx` — Server Component wrapping TransportClient
- [x] 8. Crear `components/transport/TransportClient.tsx` — orquesta tabla + modales + estado

## Acceptance criteria

- Tabla columnas: Nombre, Placa, Tipo (label legible), Disponible (badge), Activo (badge)
- `vehicle_type` muestra "Camión"/"Furgoneta"/"Moto"/"Otro" (no raw enum)
- Paginación Anterior/Siguiente
- Create/Edit/Delete funcionan e invalidan query `['transport']`
- Validación: capacity_kg y capacity_m3 > 0, license_plate único (backend), todos required
- Edit pre-llena formulario con datos del detail endpoint
- Build limpio sin errores TS
