# Spec: Drivers

## Información del módulo
- **App Django:** `apps/drivers/`
- **Tabla en BD:** `drivers_driver`
- **Dependencias:** `transport` ✅ (+ `auth_user` built-in)

---

## Modelo

### Driver
Tabla: `drivers_driver`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `user` | `OneToOneField(settings.AUTH_USER_MODEL)` | `on_delete=CASCADE` | Credenciales de acceso |
| `transport` | `ForeignKey('apps.transport.Transport')` | `on_delete=SET_NULL, null=True, blank=True` | Vehículo actualmente asignado |
| `license_number` | `CharField(50)` | `unique=True` | Número de licencia de conducir |
| `phone` | `CharField(20)` | `blank=True` | — |
| `is_available` | `BooleanField` | `default=True` | Disponible para nueva asignación |
| `is_active` | `BooleanField` | `default=True` | — |

---

## Serializers

### DriverListSerializer
Campos: `id`, `license_number`, `phone`, `is_available`, `is_active`

### DriverDetailSerializer
Campos: todos + `user` expandido (`id`, `username`, `first_name`, `last_name`, `email`)
+ `transport` expandido (`id`, `name`, `license_plate`, `vehicle_type`)

### DriverWriteSerializer
Campos: `user`, `transport`, `license_number`, `phone`, `is_available`, `is_active`
Validaciones: `license_number` único

---

## ViewSet

Clase: `DriverViewSet(ModelViewSet)`
Queryset: `Driver.objects.select_related('user', 'transport').filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/drivers/` | list |
| POST | `/api/v1/drivers/` | create |
| GET | `/api/v1/drivers/{id}/` | retrieve |
| PUT | `/api/v1/drivers/{id}/` | update |
| PATCH | `/api/v1/drivers/{id}/` | partial_update |
| DELETE | `/api/v1/drivers/{id}/` | destroy |

---

## URLs
Archivo: `apps/drivers/urls.py`
Router: `DefaultRouter()`, registro: `router.register(r'drivers', DriverViewSet)`

## Admin
`list_display`: `['id', 'user', 'license_number', 'transport', 'is_available', 'is_active']`
`list_filter`: `['is_active', 'is_available']`
`search_fields`: `['license_number', 'user__username', 'user__first_name']`

---

## Lista de tareas para Implement

1. [ ] `python manage.py startapp drivers apps/drivers`
2. [ ] Actualizar `apps/drivers/apps.py` → `name = 'apps.drivers'`
3. [ ] Agregar `'apps.drivers'` a `INSTALLED_APPS` en `config/settings/base.py`
4. [ ] Implementar `Driver` en `apps/drivers/models.py` heredando de `BaseModel`
5. [ ] `python manage.py makemigrations drivers`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/drivers/serializers.py` con List, Detail (nested user + transport), Write
8. [ ] Crear `DriverViewSet` en `apps/drivers/views.py`
9. [ ] Crear `apps/drivers/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.drivers.urls'))`
11. [ ] Registrar en `apps/drivers/admin.py`
