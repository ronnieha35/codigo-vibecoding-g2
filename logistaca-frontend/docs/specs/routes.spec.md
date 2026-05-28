# Routes Spec

**Status:** ✅ Validated

## Scope

CRUD completo de rutas. Módulo más complejo — cada ruta tiene un array de stops que se gestiona inline.
- Página `/routes` con tabla paginada
- Columnas: Nombre, Bodega origen, Duración estimada, Activo
- Modal crear/editar con:
  - Select para `origin_warehouse_id` (desde useWarehouseList)
  - Array dinámico de stops: cada stop tiene warehouse_id (Select), stop_order (auto), estimated_duration_minutes (Input)
  - Botones para agregar/quitar stops
- Dialog confirmación eliminar
- Paginación backend `?page=N`

**Complejidad**: stops[] es un array dinámico gestionado con `useFieldArray` de React Hook Form. Al enviar, se reemplaza el array completo en el backend.

## shadcn components needed

Todos ya instalados. Verificar que `button` tiene variante `ghost` para el botón quitar stop.

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/routes.types.ts` — `RouteList` (id, name, origin_warehouse nested, estimated_duration_hours, is_active), `RouteDetail` (todos los campos + stops array), `RouteStopWrite` (warehouse_id, stop_order, estimated_duration_minutes), `RouteWrite` (name, origin_warehouse_id, description, estimated_duration_hours, is_active, stops: RouteStopWrite[])
- [x] 2. Verificar `lib/api/routes.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useRoutes.ts` — useRouteList(page), useRouteDetail(id|null), useCreateRoute, useUpdateRoute, useDeleteRoute

### Components
- [x] 4. Crear `components/routes/RoutesTable.tsx` — columnas: Nombre, Bodega origen, Duración (hrs), Activo (badge), Acciones
- [x] 5. Crear `components/routes/RouteForm.tsx` — campos: name, origin_warehouse_id (Select), description, estimated_duration_hours (number), is_active (Select), stops (useFieldArray: warehouse_id Select + estimated_duration_minutes Input por stop, botones +/- stop)
- [x] 6. Crear `components/routes/RouteDeleteDialog.tsx` — AlertDialog con nombre de la ruta

### Pages
- [x] 7. Crear `app/(dashboard)/routes/page.tsx` — Server Component wrapping RoutesClient
- [x] 8. Crear `components/routes/RoutesClient.tsx` — orquesta tabla + modales + estado

## Acceptance criteria

- Tabla columnas: Nombre, Bodega origen, Duración, Activo (badge)
- Select origin_warehouse carga desde useWarehouseList
- Stops: se pueden agregar/quitar dinámicamente en el formulario
- stop_order se asigna automáticamente por posición en el array (index + 1)
- estimated_duration_hours > 0, estimated_duration_minutes ≥ 1 por stop
- Create/Edit/Delete invalidan query `['routes']`
- Edit pre-llena formulario con stops existentes (warehouse_id + duration)
- Build limpio sin errores TS
