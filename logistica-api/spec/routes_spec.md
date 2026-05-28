# Spec: Routes

## Información del módulo
- **App Django:** `apps/routes/`
- **Tabla(s) en BD:** `routes_route`, `routes_routestop`
- **Dependencias:** `warehouses` ✅

---

## Modelos

### Route
Tabla: `routes_route`
Hereda de: `apps.core.models.BaseModel`

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `name` | `CharField(200)` | — | Nombre de la ruta |
| `origin_warehouse` | `ForeignKey('apps.warehouses.Warehouse')` | `on_delete=CASCADE` | Almacén de salida |
| `description` | `TextField` | `blank=True` | — |
| `estimated_duration_hours` | `DecimalField(5,2)` | `null=True, blank=True` | Duración estimada total |
| `is_active` | `BooleanField` | `default=True` | — |

### RouteStop
Tabla: `routes_routestop`
No hereda de BaseModel — tabla auxiliar sin created_at/updated_at

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `route` | `ForeignKey('Route')` | `on_delete=CASCADE` | Ruta a la que pertenece |
| `warehouse` | `ForeignKey('apps.warehouses.Warehouse')` | `on_delete=CASCADE` | Almacén de la parada |
| `stop_order` | `PositiveSmallIntegerField` | — | Orden de la parada |
| `estimated_duration_minutes` | `PositiveIntegerField` | `null=True, blank=True` | Tiempo estimado en esta parada |

Constraint único: `UniqueConstraint(fields=['route', 'stop_order'], name='unique_route_stop_order')`

---

## Serializers

### WarehouseMinimalSerializer (helper read-only)
Campos: `id`, `name`

### RouteStopNestedSerializer (read-only, para Detail)
Campos: `id`, `warehouse` (WarehouseMinimalSerializer), `stop_order`, `estimated_duration_minutes`

### RouteStopWriteSerializer (writable, para Write)
Campos: `warehouse` (PrimaryKeyRelatedField), `stop_order`, `estimated_duration_minutes`

### RouteListSerializer
Campos: `id`, `name`, `origin_warehouse` (WarehouseMinimalSerializer), `estimated_duration_hours`, `is_active`

### RouteDetailSerializer
Campos: `id`, `name`, `origin_warehouse` (WarehouseMinimalSerializer), `description`,
`estimated_duration_hours`, `is_active`, `stops` (RouteStopNestedSerializer many, ordenado por stop_order),
`created_at`, `updated_at`

### RouteWriteSerializer
Campos: `name`, `origin_warehouse`, `description`, `estimated_duration_hours`, `is_active`, `stops`
- `stops`: lista writable de RouteStopWriteSerializer (many=True, required=False)
- `create`: pop stops, crear Route, crear RouteStop por cada item
- `update`: pop stops, actualizar Route, si stops no es None → borrar stops anteriores y recrear

---

## ViewSet

Clase: `RouteViewSet(ModelViewSet)`
Queryset: `Route.objects.select_related('origin_warehouse').prefetch_related('stops__warehouse').filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/routes/` | list |
| POST | `/api/v1/routes/` | create |
| GET | `/api/v1/routes/{id}/` | retrieve |
| PUT | `/api/v1/routes/{id}/` | update |
| PATCH | `/api/v1/routes/{id}/` | partial_update |
| DELETE | `/api/v1/routes/{id}/` | destroy |

---

## URLs
Archivo: `apps/routes/urls.py`
Router: `DefaultRouter()`, registro: `router.register(r'routes', RouteViewSet)`

## Admin
- `RouteStopInline(TabularInline)`: model=RouteStop, extra=1, ordering=['stop_order']
- `RouteAdmin`: list_display, inlines=[RouteStopInline]

---

## Lista de tareas para Implement

1. [ ] `python manage.py startapp routes apps/routes`
2. [ ] Actualizar `apps/routes/apps.py` → `name = 'apps.routes'`
3. [ ] Agregar `'apps.routes'` a `INSTALLED_APPS`
4. [ ] Implementar `Route` y `RouteStop` en `apps/routes/models.py`
5. [ ] `python manage.py makemigrations routes`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/routes/serializers.py` con nested writable stops
8. [ ] Crear `RouteViewSet` en `apps/routes/views.py`
9. [ ] Crear `apps/routes/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.routes.urls'))`
11. [ ] Registrar con RouteStopInline en `apps/routes/admin.py`
