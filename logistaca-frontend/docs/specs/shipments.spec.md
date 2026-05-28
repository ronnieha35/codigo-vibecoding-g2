# Shipments Spec

**Status:** ✅ Validated

## Scope

Módulo central del MVP. Un shipment vincula customer + warehouse + driver + transport + route + items.
- Página `/shipments` con tabla paginada
- Columnas: ID, Cliente, Estado (badge), Ciudad destino, Fecha programada, Costo
- Modal crear/editar con selects para customer, warehouse, driver, transport, route + array dinámico de items
- Vista de detalle inline expandible o panel lateral: muestra items + historial de estado (status_history)
- Dialog confirmación eliminar
- Paginación backend `?page=N`

**Complejidades**:
- `items[]` es array dinámico con `useFieldArray` (product_id Select, quantity, unit_price)
- `status_history[]` es solo lectura — se muestra en detalle, se actualiza cambiando `status` en el form
- `scheduled_date`: campo de tipo date (string ISO `YYYY-MM-DD`)
- Todos los FK opcionales: driver_id, transport_id, route_id pueden ser null

## shadcn components needed

Todos ya instalados. Para el historial de estado se usará una lista simple con badges.

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/shipments.types.ts` — `ShipmentList` (id, customer nested, status, scheduled_date, destination_city, destination_country, shipping_cost, created_at), `ShipmentDetail` (todos los campos + items nested + status_history), `ShipmentItemWrite` (product_id, quantity, unit_price), `ShipmentWrite` (todos los campos write + items: ShipmentItemWrite[])
- [x] 2. Verificar `lib/api/shipments.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useShipments.ts` — useShipmentList(page), useShipmentDetail(id|null), useCreateShipment, useUpdateShipment, useDeleteShipment

### Components
- [x] 4. Crear `components/shipments/ShipmentsTable.tsx` — columnas: ID, Cliente, Estado (badge color por status), Ciudad destino, Fecha programada, Costo, Acciones
- [x] 5. Crear `components/shipments/ShipmentForm.tsx` — campos: customer_id (Select), origin_warehouse_id (Select), driver_id (Select opcional), transport_id (Select opcional), route_id (Select opcional), destination_address, destination_city, destination_country, status (Select enum), scheduled_date (date input), shipping_cost (number), total_weight_kg (number), notes, items (useFieldArray: product_id Select + quantity + unit_price)
- [x] 6. Crear `components/shipments/ShipmentStatusHistory.tsx` — lista de entradas de status_history con badge de status + fecha + notas
- [x] 7. Crear `components/shipments/ShipmentDeleteDialog.tsx` — AlertDialog con ID del shipment

### Pages
- [x] 8. Crear `app/(dashboard)/shipments/page.tsx` — Server Component wrapping ShipmentsClient
- [x] 9. Crear `components/shipments/ShipmentsClient.tsx` — orquesta tabla + modales + estado. Al hacer click en una fila, muestra ShipmentDetail con ShipmentStatusHistory en un panel/dialog secundario

## Acceptance criteria

- Tabla: ID, Cliente, Estado (badge con color por status), Ciudad destino, Fecha, Costo
- Badges de status: PENDING=yellow, ASSIGNED=blue, IN_TRANSIT=orange, DELIVERED=green, CANCELLED=red
- Create form: customer, warehouse required; driver/transport/route opcionales
- Items dinámicos: agregar/quitar con useFieldArray
- Status history visible al ver detalle de shipment
- Cambiar status en el form crea automáticamente entrada de historial (backend lo maneja)
- Create/Edit/Delete invalidan query `['shipments']`
- Build limpio sin errores TS
