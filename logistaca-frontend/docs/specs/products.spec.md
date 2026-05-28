# Products Spec

**Status:** ✅ Validated

## Scope

CRUD completo de productos. Depende de Suppliers y Warehouses (selects en formulario).
- Página `/products` con tabla paginada
- Columnas: Nombre, SKU, Categoría, Precio, Stock, Activo
- Modal crear/editar (RHF + Zod) con selects para supplier y warehouse
- Dialog confirmación eliminar
- Paginación backend `?page=N`
- Campos numéricos: `unit_price`, `weight_kg`, `length_cm`, `width_cm`, `height_cm` → `z.number().positive()` + `valueAsNumber: true`
- `supplier_id`: Select cargado desde `useSupplierList` (required)
- `warehouse_id`: Select cargado desde `useWarehouseList` (opcional, puede ser null)

## shadcn components needed

Todos ya instalados (dialog, alert-dialog, badge, table, select, input, label, button).

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/products.types.ts` — `ProductList` (id, name, sku, category, unit_price, stock_quantity, is_active), `ProductDetail` (todos los campos + nested supplier/warehouse), `ProductWrite` (campos para create/update con supplier_id/warehouse_id)
- [x] 2. Verificar `lib/api/products.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useProducts.ts` — useProductList(page), useProductDetail(id|null), useCreateProduct, useUpdateProduct, useDeleteProduct

### Components
- [x] 4. Crear `components/products/ProductsTable.tsx` — columnas: Nombre, SKU, Categoría, Precio (formateado), Stock, Activo (badge), Acciones
- [x] 5. Crear `components/products/ProductForm.tsx` — campos: supplier_id (Select desde API), warehouse_id (Select desde API, opcional), name, sku, description, category, unit_price, weight_kg, length_cm, width_cm, height_cm, stock_quantity, is_active (Select)
- [x] 6. Crear `components/products/ProductDeleteDialog.tsx` — AlertDialog con nombre del producto

### Pages
- [x] 7. Crear `app/(dashboard)/products/page.tsx` — Server Component wrapping ProductsClient
- [x] 8. Crear `components/products/ProductsClient.tsx` — orquesta tabla + modales + estado

## Acceptance criteria

- Tabla columnas: Nombre, SKU, Categoría, Precio, Stock, Activo (badge)
- Select de supplier carga proveedores activos desde API
- Select de warehouse carga bodegas activas desde API (puede quedar vacío/null)
- unit_price, weight_kg, length_cm, width_cm, height_cm validados > 0
- stock_quantity: entero ≥ 0
- sku único (validación backend)
- Create/Edit/Delete invalidan query `['products']`
- Edit pre-llena formulario con IDs del supplier/warehouse del detail
- Build limpio sin errores TS
