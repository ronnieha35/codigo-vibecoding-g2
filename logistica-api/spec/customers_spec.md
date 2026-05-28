# Spec: Customers

## Información del módulo
- **App Django:** `apps/customers/`
- **Tabla en BD:** `customers_customer`
- **Dependencias:** ninguna (FK a `auth_user` es Django built-in)

---

## Modelo

### Customer
Tabla: `customers_customer`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `user` | `ForeignKey(settings.AUTH_USER_MODEL)` | `on_delete=SET_NULL, null=True, blank=True` | Login opcional |
| `name` | `CharField(200)` | — | Nombre empresa o persona |
| `customer_type` | `CharField(10)` | `choices=CustomerType.choices` | PERSON / COMPANY |
| `email` | `EmailField` | `unique=True` | — |
| `phone` | `CharField(20)` | `blank=True` | — |
| `address` | `TextField` | `blank=True` | — |
| `city` | `CharField(100)` | `blank=True` | — |
| `country` | `CharField(100)` | `blank=True` | — |
| `tax_id` | `CharField(50)` | `unique=True, null=True, blank=True` | RUC / DNI |
| `is_active` | `BooleanField` | `default=True` | — |

Choices:
- CustomerType.PERSON = 'PERSON'
- CustomerType.COMPANY = 'COMPANY'

---

## Serializers

### CustomerListSerializer
Campos: `id`, `name`, `customer_type`, `email`, `city`, `is_active`

### CustomerDetailSerializer
Campos: `id`, `user`, `name`, `customer_type`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `is_active`, `created_at`, `updated_at`

### CustomerWriteSerializer
Campos: `user`, `name`, `customer_type`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `is_active`
Validaciones: `email` único, `tax_id` único si se provee

---

## ViewSet

Clase: `CustomerViewSet(ModelViewSet)`
Queryset: `Customer.objects.filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/customers/` | list |
| POST | `/api/v1/customers/` | create |
| GET | `/api/v1/customers/{id}/` | retrieve |
| PUT | `/api/v1/customers/{id}/` | update |
| PATCH | `/api/v1/customers/{id}/` | partial_update |
| DELETE | `/api/v1/customers/{id}/` | destroy |

---

## URLs
Archivo: `apps/customers/urls.py`
Router: `DefaultRouter()`, registro: `router.register(r'customers', CustomerViewSet)`

## Admin
`list_display`: `['id', 'name', 'customer_type', 'email', 'city', 'is_active']`
`list_filter`: `['is_active', 'customer_type', 'country']`
`search_fields`: `['name', 'email', 'tax_id']`

---

## Lista de tareas para Implement

1. [ ] `python manage.py startapp customers apps/customers`
2. [ ] Actualizar `apps/customers/apps.py` → `name = 'apps.customers'`
3. [ ] Agregar `'apps.customers'` a `INSTALLED_APPS` en `config/settings/base.py`
4. [ ] Implementar `Customer` en `apps/customers/models.py` heredando de `BaseModel`
5. [ ] `python manage.py makemigrations customers`
6. [ ] `python manage.py migrate`
7. [ ] Crear `apps/customers/serializers.py` con List, Detail, Write
8. [ ] Crear `CustomerViewSet` en `apps/customers/views.py`
9. [ ] Crear `apps/customers/urls.py` con DefaultRouter
10. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.customers.urls'))`
11. [ ] Registrar en `apps/customers/admin.py`
