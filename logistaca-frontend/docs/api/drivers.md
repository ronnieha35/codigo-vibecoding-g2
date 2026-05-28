# Drivers

Base path: `/api/v1/drivers/`

## Entity

```typescript
interface Driver {
  id: number
  user_id: number          // OneToOne → Django User (required)
  transport_id: number | null
  license_number: string   // unique
  phone: string
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Nested Objects (read responses)

```typescript
interface DriverDetail extends Driver {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  transport: {
    id: number
    name: string
    license_plate: string
    vehicle_type: VehicleType
  } | null
}
```

## Endpoints

### List
```
GET /api/v1/drivers/
```
Response items (DriverList):
```json
{
  "id": 1, "license_number": "...",
  "phone": "...", "is_available": true, "is_active": true
}
```

### Create
```
POST /api/v1/drivers/
```
Body:
```json
{
  "user_id": 1,
  "transport_id": null,
  "license_number": "string",
  "phone": "string",
  "is_available": true,
  "is_active": true
}
```
Note: `user_id` must reference an existing Django User not already linked to a driver.
Response: DriverDetail (with nested user and transport)

### Retrieve
```
GET /api/v1/drivers/{id}/
```
Response: DriverDetail

### Update
```
PUT  /api/v1/drivers/{id}/
PATCH /api/v1/drivers/{id}/
```

### Delete
```
DELETE /api/v1/drivers/{id}/
```
Response: 204 No Content
