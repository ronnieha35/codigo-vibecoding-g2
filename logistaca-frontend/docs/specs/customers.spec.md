# Customers Spec

**Status:** ✅ Validated

## Scope

CRUD completo de clientes. Patrón idéntico a Suppliers.
- Página `/customers` con tabla paginada
- Columnas: Nombre, Tipo, Email, Ciudad, Activo
- Modal crear/editar (RHF + Zod)
- Dialog confirmación eliminar
- Paginación backend `?page=N`
- `customer_type`: enum `PERSON | COMPANY` → Select en formulario

## shadcn components needed

Todos ya instalados (dialog, alert-dialog, badge, table, select, input, label, button).

## Tasks

### Types & API
- [x] 1. Verificar `lib/types/customers.types.ts` — `CustomerList` (id, name, customer_type, email, city, is_active), `CustomerDetail` (todos los campos), `CustomerWrite` (campos para create/update)
- [x] 2. Verificar `lib/api/customers.api.ts` — list, get, create, update (PATCH), delete

### Hooks
- [x] 3. Crear `lib/hooks/useCustomers.ts` — useCustomerList(page), useCustomerDetail(id|null), useCreateCustomer, useUpdateCustomer, useDeleteCustomer

### Components
- [x] 4. Crear `components/customers/CustomersTable.tsx` — columnas: Nombre, Tipo (badge PERSON/COMPANY), Email, Ciudad, Activo (badge), Acciones
- [x] 5. Crear `components/customers/CustomerForm.tsx` — campos: name, customer_type (Select), email, phone, address, city, country, tax_id (opcional), is_active (Select)
- [x] 6. Crear `components/customers/CustomerDeleteDialog.tsx` — AlertDialog con nombre del cliente

### Pages
- [x] 7. Crear `app/(dashboard)/customers/page.tsx` — Server Component wrapping CustomersClient
- [x] 8. Crear `components/customers/CustomersClient.tsx` — orquesta tabla + modales + estado

## Acceptance criteria

- Tabla columnas: Nombre, Tipo, Email, Ciudad, Activo (badge)
- `customer_type` muestra "Persona" / "Empresa" en tabla (no raw enum)
- Paginación Anterior/Siguiente
- Create/Edit/Delete funcionan e invalidan query `['customers']`
- Formulario: email válido, `customer_type` required, `tax_id` opcional (puede enviarse null)
- Edit pre-llena formulario con datos del detail endpoint
- Build limpio sin errores TS
