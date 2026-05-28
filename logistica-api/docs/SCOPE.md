# Alcance del MVP — Logística API

## Descripción del sistema

API REST para gestión de envíos de productos tecnológicos. Permite registrar clientes, proveedores, almacenes, conductores, vehículos, rutas y envíos, con seguimiento de estado en tiempo real.

**Stack:** Django 6.0.5 + Django REST Framework 3.17.1 + PostgreSQL  
**Deploy:** Railway  
**Metodología:** SDD (Spec Driven Development) con agentes Claude

---

## Módulos del MVP

Todos los módulos incluyen operaciones CRUD completas (list, create, retrieve, update, destroy).

| Módulo | App Django | Endpoints base |
|---|---|---|
| Clientes | `customers` | `/api/v1/customers/` |
| Proveedores | `suppliers` | `/api/v1/suppliers/` |
| Almacenes | `warehouses` | `/api/v1/warehouses/` |
| Productos | `products` | `/api/v1/products/` |
| Transporte | `transport` | `/api/v1/transport/` |
| Conductores | `drivers` | `/api/v1/drivers/` |
| Rutas | `routes` | `/api/v1/routes/` |
| Envíos | `shipments` | `/api/v1/shipments/` |

`shipments` es el módulo central — referencia a todos los demás.

---

## Autenticación

- **Proveedor:** Django built-in (`django.contrib.auth`) + `djangorestframework-simplejwt`
- **Mecanismo:** JWT sin estado en servidor
- **Todos los endpoints requieren autenticación** (`IsAuthenticated` por defecto)

| Método | URL | Acción |
|---|---|---|
| POST | `/api/v1/auth/token/` | Login → `access` + `refresh` tokens |
| POST | `/api/v1/auth/token/refresh/` | Renovar `access` token |
| POST | `/api/v1/auth/token/verify/` | Verificar validez de token |

**Header requerido en cada request:**
```
Authorization: Bearer <access_token>
```

---

## Orden de desarrollo (por dependencias)

| Fase | Apps | Razón |
|---|---|---|
| 0 | `core` + settings split + `.env` + JWT | Base de todo |
| 1 | `suppliers`, `warehouses` | Sin dependencias |
| 2 | `products` | Depende de `suppliers` + `warehouses` |
| 3 | `customers`, `transport` | Sin dependencias entre sí |
| 4 | `drivers` | Depende de `transport` |
| 5 | `routes` | Depende de `warehouses` |
| 6 | `shipments` | Depende de todos los módulos anteriores |

---

## Fuera del alcance del MVP

- Notificaciones (email, SMS, push)
- Integración con sistemas de pago
- Reportes y dashboards analíticos
- Geolocalización en tiempo real
- Panel de administración personalizado (más allá del Django admin)
- Roles y permisos granulares por módulo (MVP usa `IsAuthenticated` global)
- Multi-tenancy

---

## Estructura de carpetas objetivo

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   └── development.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/              # BaseModel, StandardPagination, exception handler
│   ├── customers/
│   ├── suppliers/
│   ├── warehouses/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   └── shipments/
├── spec/                  # Especificaciones SDD por módulo
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   └── SCOPE.md
├── .env
├── manage.py
└── requirements.txt
```

---

## Respuesta estándar de la API

**Lista paginada:**
```json
{
  "count": 100,
  "next": "/api/v1/products/?page=2",
  "previous": null,
  "results": [...]
}
```

**Errores:** status HTTP correctos — `400`, `401`, `403`, `404`, `409`

---

## Deploy en Railway

- Base de datos: PostgreSQL (provisioned por Railway)
- Variables de entorno: `SECRET_KEY`, `DATABASE_URL`, `DEBUG=False`, `ALLOWED_HOSTS`
- `python-decouple` para leer variables desde `.env` en dev y entorno en prod
- `gunicorn` como servidor WSGI para producción
