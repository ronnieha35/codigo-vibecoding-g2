# Transport (Vehicles)

Base path: `/api/v1/transport/`

## Enums

```typescript
type VehicleType = 'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'OTHER'
```

## Entity

```typescript
interface Transport {
  id: number
  name: string
  license_plate: string    // unique
  vehicle_type: VehicleType
  capacity_kg: number      // decimal, > 0
  capacity_m3: number      // decimal, > 0
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Endpoints

### List
```
GET /api/v1/transport/
```
Response items (TransportList):
```json
{
  "id": 1, "name": "...", "license_plate": "...",
  "vehicle_type": "TRUCK", "is_available": true, "is_active": true
}
```

### Create
```
POST /api/v1/transport/
```
Body:
```json
{
  "name": "string",
  "license_plate": "string",
  "vehicle_type": "TRUCK",
  "capacity_kg": 5000.0,
  "capacity_m3": 20.0,
  "is_available": true,
  "is_active": true
}
```
Validations: `capacity_kg` and `capacity_m3` must be > 0.
Response: TransportDetail (all fields)

### Retrieve
```
GET /api/v1/transport/{id}/
```
Response: TransportDetail (all fields)

### Update
```
PUT  /api/v1/transport/{id}/
PATCH /api/v1/transport/{id}/
```

### Delete
```
DELETE /api/v1/transport/{id}/
```
Response: 204 No Content
