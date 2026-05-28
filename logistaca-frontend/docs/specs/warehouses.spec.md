# Warehouses Spec

**Status:** ✅ Validated

## Scope

CRUD completo de bodegas. Incluye:
- Página `/warehouses` con tabla paginada (TanStack Table)
- Columnas: Nombre, Ciudad, País, Activo
- Modal crear/editar con formulario (React Hook Form + Zod)
- Dialog de confirmación de eliminación
- Estados: loading, error, vacío
- Paginación conectada al backend `?page=N`

## shadcn components needed

```bash
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add select
```

> `card`, `input`, `label`, `button` ya instalados.

## Tasks

### Types & API — verificar existentes
- [x] 1. Verificar `lib/types/warehouses.types.ts` — confirmar `WarehouseList` (id, name, city, country, is_active), `WarehouseDetail` (todos los campos), `WarehouseWrite` (campos de creación). ✓ Ya existe y es correcto.
- [x] 2. Verificar `lib/api/warehouses.api.ts` — confirmar `list`, `get`, `create`, `update`, `delete`. ✓ Ya existe y es correcto.

### Hooks (TanStack Query)
- [x] 3. Crear `lib/hooks/useWarehouses.ts` — hooks:
  - `useWarehouseList(page: number)` — `useQuery` lista paginada
  - `useCreateWarehouse()` — `useMutation` POST, invalida `['warehouses']`
  - `useUpdateWarehouse()` — `useMutation` PATCH, invalida `['warehouses']`
  - `useDeleteWarehouse()` — `useMutation` DELETE, invalida `['warehouses']`

### Components
- [x] 4. Crear `components/warehouses/WarehousesTable.tsx` — `"use client"`. TanStack Table con columnas:
  - **Nombre** (`name`) — texto
  - **Ciudad** (`city`) — texto
  - **País** (`country`) — texto
  - **Activo** (`is_active`) — Badge verde/gris
  - **Acciones** — botones Editar + Eliminar por fila

- [x] 5. Crear `components/warehouses/WarehouseForm.tsx` — `"use client"`. Formulario con React Hook Form + Zod:
  - Campos: `name` (required), `address` (required), `city` (required), `country` (required), `phone` (required), `capacity_m3` (number, > 0), `is_active` (boolean, default true)
  - Modo create: campos vacíos
  - Modo edit: pre-rellena con `WarehouseDetail` recibido por prop
  - Submit: llama `useCreateWarehouse` o `useUpdateWarehouse` según modo
  - Muestra errores del backend bajo el campo correspondiente

- [x] 6. Crear `components/warehouses/WarehouseDeleteDialog.tsx` — `"use client"`. shadcn `AlertDialog`:
  - Prop: `warehouse: WarehouseList`, `onConfirm: () => void`, `isPending: boolean`
  - Texto: "¿Eliminar bodega **{name}**? Esta acción no se puede deshacer."
  - Botón confirmar: llama `useDeleteWarehouse`, estado loading mientras `isPending`

### Pages
- [x] 7. Crear `app/(dashboard)/warehouses/page.tsx` — Server Component que renderiza `<WarehousesClient />`
- [x] 8. Crear `components/warehouses/WarehousesClient.tsx` — `"use client"`. Orquesta tabla + modales:
  - Estado: `page` (número), `editingWarehouse` (WarehouseDetail | null), `deletingWarehouse` (WarehouseList | null), `showCreateForm` (boolean)
  - Header: título "Bodegas" + botón "Nueva Bodega"
  - Renderiza `<WarehousesTable>` con datos y handlers
  - Renderiza `<Dialog>` wrapping `<WarehouseForm>` para crear/editar
  - Renderiza `<WarehouseDeleteDialog>` para eliminar
  - Paginación: botones Anterior/Siguiente conectados a `page` state

## Acceptance criteria

- [ ] Tabla muestra columnas: Nombre, Ciudad, País, Activo (badge)
- [ ] Paginación funciona: botones Anterior/Siguiente cambian datos
- [ ] Click "Nueva Bodega" → abre modal con formulario vacío
- [ ] Submit crear → llama API, cierra modal, refresca tabla
- [ ] Click editar fila → abre modal pre-rellenado con datos de esa bodega
- [ ] Submit editar → llama API con PATCH, cierra modal, refresca tabla
- [ ] Click eliminar fila → abre dialog de confirmación con nombre de bodega
- [ ] Confirmar eliminar → llama API DELETE, cierra dialog, refresca tabla
- [ ] Estado loading en tabla durante fetch inicial
- [ ] Estado vacío si no hay bodegas
- [ ] Errores del backend mostrados en formulario
- [ ] `capacity_m3` rechaza valores ≤ 0 (validación Zod)
- [ ] Sin errores TypeScript (`npm run build` limpio)

## Notas

- `WarehouseForm` recibe `defaultValues?: WarehouseDetail` — si está presente, modo edit; si no, modo create.
- Para editar, necesitamos el `WarehouseDetail` completo (tiene `address`, `phone`, `capacity_m3` que no están en `WarehouseList`). Usar `warehousesApi.get(id)` al hacer click editar, o pasar el objeto ya cargado desde la tabla. Opción simple: al click editar, `useQuery` con el id para obtener el detalle.
- `is_active` en formulario: usar `<Select>` con opciones Activo/Inactivo para mejor UX.
