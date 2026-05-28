# Customers

Base path: `/api/v1/customers/`

## Enums

```typescript
type CustomerType = 'PERSON' | 'COMPANY'
```

## Entity

```typescript
interface Customer {
  id: number
  user_id: number | null     // FK to Django User
  name: string
  customer_type: CustomerType
  email: string              // unique
  phone: string
  address: string
  city: string
  country: string
  tax_id: string | null      // unique when present
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Endpoints

### List
```
GET /api/v1/customers/
```
Response items (CustomerList):
```json
{
  "id": 1, "name": "...", "customer_type": "COMPANY",
  "email": "...", "city": "...", "is_active": true
}
```

### Create
```
POST /api/v1/customers/
```
Body:
```json
{
  "user_id": null,
  "name": "string",
  "customer_type": "PERSON",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "tax_id": null,
  "is_active": true
}
```
Response: CustomerDetail (all fields)

### Retrieve
```
GET /api/v1/customers/{id}/
```
Response: CustomerDetail (all fields)

### Update
```
PUT  /api/v1/customers/{id}/
PATCH /api/v1/customers/{id}/
```

### Delete
```
DELETE /api/v1/customers/{id}/
```
Response: 204 No Content
