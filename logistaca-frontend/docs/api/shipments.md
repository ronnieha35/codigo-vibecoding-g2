# Shipments

Base path: `/api/v1/shipments/`

Central module. A shipment links a customer, origin warehouse, driver, transport, and route. Creating a shipment auto-creates the first `ShipmentStatusHistory` entry. Changing status auto-appends a new history entry. Items are replaced on every update.

## Enums

```typescript
type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
```

## Entities

```typescript
interface ShipmentItem {
  id: number
  product_id: number
  quantity: number       // > 0
  unit_price: number
}

interface ShipmentStatusHistory {
  id: number
  status: ShipmentStatus
  changed_at: string
  changed_by: { id: number; username: string } | null
  notes: string
}

interface Shipment {
  id: number
  customer_id: number
  origin_warehouse_id: number
  driver_id: number | null
  transport_id: number | null
  route_id: number | null
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus          // default: PENDING
  scheduled_date: string          // ISO date
  delivered_at: string | null
  shipping_cost: number
  total_weight_kg: number
  notes: string
  created_at: string
  updated_at: string
}
```

## Nested Objects (read responses)

```typescript
interface ShipmentDetail extends Shipment {
  customer: { id: number; name: string }
  origin_warehouse: { id: number; name: string; city: string }
  driver: { id: number; license_number: string } | null
  transport: { id: number; name: string; license_plate: string; vehicle_type: string } | null
  route: { id: number; name: string } | null
  items: Array<{
    id: number
    product: { id: number; name: string; sku: string }
    quantity: number
    unit_price: number
  }>
  status_history: ShipmentStatusHistory[]
}
```

## Endpoints

### List
```
GET /api/v1/shipments/
```
Response items (ShipmentList):
```json
{
  "id": 1,
  "customer": { "id": 1, "name": "..." },
  "status": "PENDING",
  "scheduled_date": "2024-01-15",
  "destination_city": "...",
  "destination_country": "...",
  "shipping_cost": "150.00",
  "created_at": "..."
}
```

### Create
```
POST /api/v1/shipments/
```
Body:
```json
{
  "customer_id": 1,
  "origin_warehouse_id": 1,
  "driver_id": null,
  "transport_id": null,
  "route_id": null,
  "destination_address": "string",
  "destination_city": "string",
  "destination_country": "string",
  "status": "PENDING",
  "scheduled_date": "2024-01-15",
  "shipping_cost": 150.00,
  "total_weight_kg": 25.5,
  "notes": "string",
  "items": [
    { "product_id": 1, "quantity": 2, "unit_price": 99.99 }
  ]
}
```
Auto-creates first ShipmentStatusHistory entry on creation.
Response: ShipmentDetail

### Retrieve
```
GET /api/v1/shipments/{id}/
```
Response: ShipmentDetail (full nested object with items and status_history)

### Update
```
PUT  /api/v1/shipments/{id}/   → full replace (items array replaces all items)
PATCH /api/v1/shipments/{id}/  → partial update
```
Note: changing `status` auto-appends a new ShipmentStatusHistory entry.

### Delete
```
DELETE /api/v1/shipments/{id}/
```
Response: 204 No Content
