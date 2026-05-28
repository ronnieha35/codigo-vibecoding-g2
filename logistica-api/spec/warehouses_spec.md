# Spec: Warehouses

## Información del módulo
- **App Django:** `apps/warehouses/`
- **Tabla en BD:** `warehouses_warehouse`
- **Dependencias:** ninguna

---

## Modelo

### Warehouse
Tabla: `warehouses_warehouse`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `name` | `CharField(200)` | — | Nombre del almacén |
| `address` | `TextField` | `blank=True` | — |
| `city` | `CharField(100)` | `blank=True` | — |
| `country` | `CharField(100)` | `blank=True` | — |
| `phone` | `CharField(20)` | `blank=True` | — |
| `capacity_m3` | `DecimalField(8,2)` | `null=True, blank=True` | Capacidad total en m³ |
| `is_active` | `BooleanField` | `default=True` | — |

---

## Serializers

### WarehouseListSerializer
Campos: `id`, `name`, `city`, `country`, `is_active`

### WarehouseDetailSerializer
Campos: todos (`id`, `name`, `address`, `city`, `country`, `phone`, `capacity_m3`, `is_active`, `created_at`, `updated_at`)

### WarehouseWriteSerializer
Campos: `name`, `address`, `city`, `country`, `phone`, `capacity_m3`, `is_active`
Validaciones: `capacity_m3` debe ser positivo si se provee

---

## ViewSet

Clase: `WarehouseViewSet(ModelViewSet)`
Queryset: `Warehouse.objects.filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/warehouses/` | list |
| POST | `/api/v1/warehouses/` | create |
| GET | `/api/v1/warehouses/{id}/` | retrieve |
| PUT | `/api/v1/warehouses/{id}/` | update |
| PATCH | `/api/v1/warehouses/{id}/` | partial_update |
| DELETE | `/api/v1/warehouses/{id}/` | destroy |

---

## URLs

Archivo: `apps/warehouses/urls.py`
Router: `DefaultRouter()`
Registro: `router.register(r'warehouses', WarehouseViewSet)`

---

## Admin

Archivo: `apps/warehouses/admin.py`
`list_display`: `['id', 'name', 'city', 'country', 'capacity_m3', 'is_active']`
`list_filter`: `['is_active', 'country']`
`search_fields`: `['name', 'city']`

---

## Lista de tareas para Implement

1. [ ] Crear app: `python manage.py startapp warehouses apps/warehouses`
2. [ ] Actualizar `apps/warehouses/apps.py` → `name = 'apps.warehouses'`
3. [ ] Agregar `'apps.warehouses'` a `INSTALLED_APPS` en `config/settings/base.py`
4. [ ] Implementar `Warehouse` en `apps/warehouses/models.py` heredando de `BaseModel`
5. [ ] `python manage.py makemigrations warehouses`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/warehouses/serializers.py` con List, Detail, Write
8. [ ] Crear `WarehouseViewSet` en `apps/warehouses/views.py`
9. [ ] Crear `apps/warehouses/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.warehouses.urls'))`
11. [ ] Registrar en `apps/warehouses/admin.py`
