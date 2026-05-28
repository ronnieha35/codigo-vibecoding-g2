# Warehouses

Base path: `/api/v1/warehouses/`

## Entity

```typescript
interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone: string
  capacity_m3: number    // decimal, must be > 0
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Endpoints

### List
```
GET /api/v1/warehouses/
```
Response items (WarehouseList):
```json
{ "id": 1, "name": "...", "city": "...", "country": "...", "is_active": true }
```

### Create
```
POST /api/v1/warehouses/
```
Body:
```json
{
  "name": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "phone": "string",
  "capacity_m3": 500.0,
  "is_active": true
}
```
Validation: `capacity_m3` must be > 0.
Response: WarehouseDetail (all fields)

### Retrieve
```
GET /api/v1/warehouses/{id}/
```
Response: WarehouseDetail (all fields)

### Update
```
PUT  /api/v1/warehouses/{id}/
PATCH /api/v1/warehouses/{id}/
```

### Delete
```
DELETE /api/v1/warehouses/{id}/
```
Response: 204 No Content
