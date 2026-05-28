# Spec: Suppliers

## Información del módulo
- **App Django:** `apps/suppliers/`
- **Tabla en BD:** `suppliers_supplier`
- **Dependencias:** ninguna

---

## Modelo

### Supplier
Tabla: `suppliers_supplier`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `name` | `CharField(200)` | — | Razón social |
| `email` | `EmailField` | `unique=True` | — |
| `phone` | `CharField(20)` | `blank=True` | — |
| `address` | `TextField` | `blank=True` | — |
| `city` | `CharField(100)` | `blank=True` | — |
| `country` | `CharField(100)` | `blank=True` | — |
| `tax_id` | `CharField(50)` | `unique=True` | RUC de la empresa |
| `contact_name` | `CharField(200)` | `blank=True` | Persona de contacto |
| `is_active` | `BooleanField` | `default=True` | — |

---

## Serializers

### SupplierListSerializer
Campos: `id`, `name`, `email`, `tax_id`, `is_active`

### SupplierDetailSerializer
Campos: todos (`id`, `name`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `contact_name`, `is_active`, `created_at`, `updated_at`)

### SupplierWriteSerializer
Campos: `name`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `contact_name`, `is_active`
Validaciones: `email` único, `tax_id` único

---

## ViewSet

Clase: `SupplierViewSet(ModelViewSet)`
Queryset: `Supplier.objects.filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/suppliers/` | list |
| POST | `/api/v1/suppliers/` | create |
| GET | `/api/v1/suppliers/{id}/` | retrieve |
| PUT | `/api/v1/suppliers/{id}/` | update |
| PATCH | `/api/v1/suppliers/{id}/` | partial_update |
| DELETE | `/api/v1/suppliers/{id}/` | destroy |

---

## URLs

Archivo: `apps/suppliers/urls.py`
Router: `DefaultRouter()`
Registro: `router.register(r'suppliers', SupplierViewSet)`

---

## Admin

Archivo: `apps/suppliers/admin.py`
`list_display`: `['id', 'name', 'email', 'tax_id', 'is_active', 'created_at']`
`list_filter`: `['is_active', 'country']`
`search_fields`: `['name', 'email', 'tax_id']`

---

## Lista de tareas para Implement

1. [ ] Crear app: `python manage.py startapp suppliers apps/suppliers`
2. [ ] Actualizar `apps/suppliers/apps.py` → `name = 'apps.suppliers'`
3. [ ] Agregar `'apps.suppliers'` a `INSTALLED_APPS` en `config/settings/base.py`
4. [ ] Implementar `Supplier` en `apps/suppliers/models.py` heredando de `BaseModel`
5. [ ] `python manage.py makemigrations suppliers`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/suppliers/serializers.py` con List, Detail, Write
8. [ ] Crear `SupplierViewSet` en `apps/suppliers/views.py`
9. [ ] Crear `apps/suppliers/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.suppliers.urls'))`
11. [ ] Registrar en `apps/suppliers/admin.py`
