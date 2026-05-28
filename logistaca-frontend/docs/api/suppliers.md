# Suppliers

Base path: `/api/v1/suppliers/`

## Entity

```typescript
interface Supplier {
  id: number
  name: string
  email: string          // unique
  phone: string
  address: string
  city: string
  country: string
  tax_id: string         // unique
  contact_name: string
  is_active: boolean
  created_at: string     // ISO datetime
  updated_at: string
}
```

## Endpoints

### List
```
GET /api/v1/suppliers/
```
Response items (SupplierList):
```json
{ "id": 1, "name": "...", "email": "...", "tax_id": "...", "is_active": true }
```

### Create
```
POST /api/v1/suppliers/
```
Body (all required unless noted):
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "tax_id": "string",
  "contact_name": "string",
  "is_active": true
}
```
Response: SupplierDetail (all fields)

### Retrieve
```
GET /api/v1/suppliers/{id}/
```
Response: SupplierDetail (all fields including created_at, updated_at)

### Update
```
PUT  /api/v1/suppliers/{id}/   → full replace
PATCH /api/v1/suppliers/{id}/  → partial update
```
Body: same as Create (PATCH allows partial)

### Delete
```
DELETE /api/v1/suppliers/{id}/
```
Response: 204 No Content
