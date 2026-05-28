# Routes

Base path: `/api/v1/routes/`

Routes define named delivery paths with ordered warehouse stops. Creating/updating a route with `stops` automatically creates/replaces the RouteStop entries.

## Entities

```typescript
interface RouteStop {
  id: number
  warehouse_id: number
  stop_order: number                 // unique per route
  estimated_duration_minutes: number
}

interface Route {
  id: number
  name: string
  origin_warehouse_id: number
  description: string
  estimated_duration_hours: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Nested Objects (read responses)

```typescript
interface RouteDetail extends Route {
  origin_warehouse: { id: number; name: string }
  stops: Array<{
    id: number
    warehouse: { id: number; name: string }
    stop_order: number
    estimated_duration_minutes: number
  }>
}
```

## Endpoints

### List
```
GET /api/v1/routes/
```
Response items (RouteList):
```json
{
  "id": 1, "name": "...",
  "origin_warehouse": { "id": 1, "name": "..." },
  "estimated_duration_hours": 4.5, "is_active": true
}
```

### Create
```
POST /api/v1/routes/
```
Body:
```json
{
  "name": "string",
  "origin_warehouse_id": 1,
  "description": "string",
  "estimated_duration_hours": 4.5,
  "is_active": true,
  "stops": [
    { "warehouse_id": 2, "stop_order": 1, "estimated_duration_minutes": 30 },
    { "warehouse_id": 3, "stop_order": 2, "estimated_duration_minutes": 45 }
  ]
}
```
Note: `stop_order` must be unique within the route. Stops are replaced on update.
Response: RouteDetail

### Retrieve
```
GET /api/v1/routes/{id}/
```
Response: RouteDetail (with origin_warehouse and stops array)

### Update
```
PUT  /api/v1/routes/{id}/   → replaces stops entirely
PATCH /api/v1/routes/{id}/  → partial update
```

### Delete
```
DELETE /api/v1/routes/{id}/
```
Response: 204 No Content
