# Spec: Transport

## Información del módulo
- **App Django:** `apps/transport/`
- **Tabla en BD:** `transport_transport`
- **Dependencias:** ninguna

---

## Modelo

### Transport
Tabla: `transport_transport`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `name` | `CharField(200)` | — | Nombre / descripción del vehículo |
| `license_plate` | `CharField(20)` | `unique=True` | Placa |
| `vehicle_type` | `CharField(15)` | `choices=VehicleType.choices` | TRUCK / VAN / MOTORCYCLE / OTHER |
| `capacity_kg` | `DecimalField(10,2)` | `null=True, blank=True` | Carga máxima en kg |
| `capacity_m3` | `DecimalField(8,2)` | `null=True, blank=True` | Volumen máximo en m³ |
| `is_available` | `BooleanField` | `default=True` | Libre para asignar |
| `is_active` | `BooleanField` | `default=True` | — |

Choices:
- VehicleType.TRUCK = 'TRUCK'
- VehicleType.VAN = 'VAN'
- VehicleType.MOTORCYCLE = 'MOTORCYCLE'
- VehicleType.OTHER = 'OTHER'

---

## Serializers

### TransportListSerializer
Campos: `id`, `name`, `license_plate`, `vehicle_type`, `is_available`, `is_active`

### TransportDetailSerializer
Campos: `id`, `name`, `license_plate`, `vehicle_type`, `capacity_kg`, `capacity_m3`, `is_available`, `is_active`, `created_at`, `updated_at`

### TransportWriteSerializer
Campos: `name`, `license_plate`, `vehicle_type`, `capacity_kg`, `capacity_m3`, `is_available`, `is_active`
Validaciones: `capacity_kg` y `capacity_m3` deben ser positivos si se proveen

---

## ViewSet

Clase: `TransportViewSet(ModelViewSet)`
Queryset: `Transport.objects.filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/transport/` | list |
| POST | `/api/v1/transport/` | create |
| GET | `/api/v1/transport/{id}/` | retrieve |
| PUT | `/api/v1/transport/{id}/` | update |
| PATCH | `/api/v1/transport/{id}/` | partial_update |
| DELETE | `/api/v1/transport/{id}/` | destroy |

---

## URLs
Archivo: `apps/transport/urls.py`
Router: `DefaultRouter()`, registro: `router.register(r'transport', TransportViewSet)`

## Admin
`list_display`: `['id', 'name', 'license_plate', 'vehicle_type', 'is_available', 'is_active']`
`list_filter`: `['is_active', 'vehicle_type', 'is_available']`
`search_fields`: `['name', 'license_plate']`

---

## Lista de tareas para Implement

1. [ ] `python manage.py startapp transport apps/transport`
2. [ ] Actualizar `apps/transport/apps.py` → `name = 'apps.transport'`
3. [ ] Agregar `'apps.transport'` a `INSTALLED_APPS` en `config/settings/base.py`
4. [ ] Implementar `Transport` en `apps/transport/models.py` heredando de `BaseModel`
5. [ ] `python manage.py makemigrations transport`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/transport/serializers.py` con List, Detail, Write
8. [ ] Crear `TransportViewSet` en `apps/transport/views.py`
9. [ ] Crear `apps/transport/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.transport.urls'))`
11. [ ] Registrar en `apps/transport/admin.py`
