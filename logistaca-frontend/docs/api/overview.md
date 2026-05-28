# API Overview

Backend: Django 6 + DRF · Python 3.14
Source: `/Users/ronniealarcon/dev/codigo-vibecoding-g2/logistica-api`
Docs (when running): `http://localhost:8000/api/docs/` (Swagger) · `/api/redoc/`

## Base URL

```
http://localhost:8000/api/v1/
```

## Authentication

JWT via `djangorestframework-simplejwt`. All endpoints except `/auth/token/` require:

```
Authorization: Bearer <access_token>
```

| Token | Lifetime |
|-------|----------|
| Access | 60 min |
| Refresh | 7 days |

## Pagination

All list endpoints are paginated (default 20, max 100).

```
GET /api/v1/suppliers/?page=2&page_size=50
```

Response shape:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/suppliers/?page=3",
  "previous": "http://localhost:8000/api/v1/suppliers/?page=1",
  "results": [...]
}
```

## Error Format

All errors wrapped by custom exception handler:

```json
{
  "error": {
    "field_name": ["error message"]
  },
  "status_code": 400
}
```

## Modules

| Module | Base Path |
|--------|-----------|
| Auth | `/api/v1/auth/` |
| Suppliers | `/api/v1/suppliers/` |
| Warehouses | `/api/v1/warehouses/` |
| Products | `/api/v1/products/` |
| Customers | `/api/v1/customers/` |
| Transport | `/api/v1/transport/` |
| Drivers | `/api/v1/drivers/` |
| Routes | `/api/v1/routes/` |
| Shipments | `/api/v1/shipments/` |
