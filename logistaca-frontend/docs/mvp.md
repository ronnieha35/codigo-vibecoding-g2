# MVP — Logistaca Frontend

## Orden de construcción

Módulos ordenados por dependencias de datos. Trabajar uno a la vez. Consultar este archivo para saber cuál sigue.

| Orden | Módulo | Dependencias frontend | Estado |
|-------|--------|-----------------------|--------|
| 0 | **Auth** | — | ✅ Completado |
| 1 | **Warehouses** | — | ✅ Completado |
| 2 | **Suppliers** | — | ✅ Completado |
| 3 | **Customers** | — | ✅ Completado |
| 4 | **Transport** | — | ✅ Completado |
| 5 | **Products** | Suppliers + Warehouses (selects en formulario) | ✅ Completado |
| 6 | **Drivers** | Transport (select en formulario) | ✅ Completado |
| 7 | **Routes** | Warehouses (origin + stops selects) | ✅ Completado |
| 8 | **Shipments** | Customers + Warehouses + Drivers + Transport + Routes | ✅ Completado |

## Scope por módulo

### Auth (Módulo 0)
- Página `/login` con formulario username + password
- POST a `/api/v1/auth/token/` → guardar tokens en Zustand (persist localStorage)
- Middleware de ruta: redirigir a `/login` si no hay token
- Redirigir a `/` tras login exitoso
- Botón logout en sidebar → limpiar store → redirect `/login`

### Módulos 1–8 (CRUD estándar)
Cada módulo incluye:
- Página principal con tabla paginada (TanStack Table)
  - Columnas según serializer List del backend
  - Paginación conectada al backend (`?page=N`)
  - Botón "Nuevo" → abre modal de creación
  - Acciones por fila: Editar (modal) + Eliminar (dialog confirmación)
- Modal crear/editar con formulario tipado (React Hook Form cuando se instale)
- Dialog de confirmación de eliminación
- Manejo de estados: loading, error, vacío

### Shipments (Módulo 8) — adicional
- Vista de detalle `/shipments/{id}` con:
  - Items del envío
  - Historial de estado con timeline
  - Cambio de status inline

## Regla de trabajo
1. Invocar `/orchester` para iniciar ciclo
2. `/spect <module>` genera spec → **esperar aprobación humana**
3. `/implement <module>` ejecuta tareas del spec
4. `/validator <module>` verifica y marca spec como validado
5. Actualizar estado en este archivo: ⬜ → 🔄 → ✅
