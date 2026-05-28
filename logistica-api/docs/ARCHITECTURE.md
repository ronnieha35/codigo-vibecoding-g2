# Arquitectura de Desarrollo — MVP

## Estructura de carpetas

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py          # settings comunes
│   │   └── development.py   # override para dev (DEBUG, SQLite)
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/                # utilidades compartidas
│   ├── customers/
│   ├── suppliers/
│   ├── warehouses/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   └── shipments/
├── docs/
│   ├── DATABASE_SCHEMA.md
│   └── ARCHITECTURE.md
├── .env
├── manage.py
└── requirements.txt
```

---

## App `core` — utilidades compartidas

Contiene todo lo reutilizable entre apps:

| Archivo | Contenido |
|---|---|
| `core/models.py` | `BaseModel` con `created_at` + `updated_at` — todas las apps heredan de este |
| `core/pagination.py` | `StandardPagination` con `page_size=20` |
| `core/exceptions.py` | Handler global de excepciones DRF |

---

## Settings split

| Archivo | Propósito |
|---|---|
| `config/settings/base.py` | Toda la configuración común (apps, DRF, JWT, middleware) |
| `config/settings/development.py` | `DEBUG=True`, SQLite, variables desde `.env` vía `python-decouple` |

`manage.py` apunta a `development.py` por defecto vía `DJANGO_SETTINGS_MODULE`.

---

## Autenticación

Librería: `djangorestframework-simplejwt` — JWT sin estado en servidor.

```
pip install djangorestframework-simplejwt
```

**Endpoints:**

| Método | URL | Descripción |
|---|---|---|
| POST | `/api/v1/auth/token/` | Login → retorna `access` + `refresh` |
| POST | `/api/v1/auth/token/refresh/` | Renueva `access` usando `refresh` |
| POST | `/api/v1/auth/token/verify/` | Verifica si un token es válido |

**Header en cada request autenticado:**
```
Authorization: Bearer <access_token>
```

**Configuración en `config/settings/base.py`:**
```python
from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

---

## Estructura interna de cada app

```
apps/<nombre>/
├── __init__.py
├── apps.py
├── models.py         # hereda de core.BaseModel
├── serializers.py    # ListSerializer + DetailSerializer + WriteSerializer
├── views.py          # ModelViewSet
├── urls.py           # Router registration
├── admin.py
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   └── test_views.py
└── migrations/
```

---

## Patrón de serializers

Cada recurso tiene hasta 3 serializers:

| Serializer | Acción DRF | Campos |
|---|---|---|
| `XListSerializer` | `list` | Solo campos clave: `id`, `name`, `status` |
| `XDetailSerializer` | `retrieve` | Todos los campos + relaciones expandidas |
| `XWriteSerializer` | `create`, `update`, `partial_update` | Campos editables + validaciones |

---

## Patrón de ViewSets

```python
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

class XViewSet(ModelViewSet):
    queryset = X.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return XListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return XWriteSerializer
        return XDetailSerializer
```

---

## URLs y versionado

Prefijo `/api/v1/` desde el primer día. Cada app registra su propio router.

**`apps/<nombre>/urls.py`:**
```python
from rest_framework.routers import DefaultRouter
from .views import XViewSet

router = DefaultRouter()
router.register(r'<nombre>', XViewSet)
urlpatterns = router.urls
```

**`config/urls.py`:**
```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('api/v1/auth/token/', TokenObtainPairView.as_view()),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view()),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view()),
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.suppliers.urls')),
    path('api/v1/', include('apps.warehouses.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.transport.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    path('api/v1/', include('apps.routes.urls')),
    path('api/v1/', include('apps.shipments.urls')),
]
```

**Endpoints disponibles:**
```
POST   /api/v1/auth/token/
POST   /api/v1/auth/token/refresh/
POST   /api/v1/auth/token/verify/
GET    /api/v1/customers/
GET    /api/v1/suppliers/
GET    /api/v1/warehouses/
GET    /api/v1/products/
GET    /api/v1/transport/
GET    /api/v1/drivers/
GET    /api/v1/routes/
GET    /api/v1/shipments/
```

---

## Respuesta estándar de la API

Listas paginadas (DRF por defecto):
```json
{
  "count": 100,
  "next": "/api/v1/products/?page=2",
  "previous": null,
  "results": [...]
}
```

Errores usan los status HTTP correctos: `400`, `401`, `403`, `404`, `409`.

---

## Orden de desarrollo del MVP

Las apps sin dependencias van primero para no bloquear el avance:

| Fase | Apps | Motivo |
|---|---|---|
| 0 | `core` + settings split + `.env` + JWT | Base de todo el proyecto |
| 1 | `suppliers`, `warehouses` | Sin dependencias entre sí ni con otras apps |
| 2 | `products` | Depende de `suppliers` + `warehouses` |
| 3 | `customers`, `transport` | Sin dependencias entre sí |
| 4 | `drivers` | Depende de `transport` |
| 5 | `routes` | Depende de `warehouses` |
| 6 | `shipments` | Depende de todos los módulos anteriores |

---

## Testing

| Herramienta | Uso |
|---|---|
| `django.test.TestCase` | Tests de modelos (validaciones, constraints) |
| `rest_framework.test.APITestCase` | Tests de vistas (endpoints, permisos, respuestas) |

```bash
# Todos los tests
python manage.py test apps

# App específica
python manage.py test apps.products

# Archivo específico
python manage.py test apps.products.tests.test_views
```
