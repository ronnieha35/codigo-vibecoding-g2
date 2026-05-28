# Products

Base path: `/api/v1/products/`

## Entity

```typescript
interface Product {
  id: number
  supplier_id: number
  warehouse_id: number | null
  name: string
  sku: string            // unique
  description: string
  category: string
  unit_price: number     // decimal, > 0
  weight_kg: number      // decimal, > 0
  length_cm: number      // decimal, > 0
  width_cm: number       // decimal, > 0
  height_cm: number      // decimal, > 0
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Nested Objects (read responses)

```typescript
interface ProductDetail extends Product {
  supplier: { id: number; name: string }
  warehouse: { id: number; name: string; city: string } | null
}
```

## Endpoints

### List
```
GET /api/v1/products/
```
Response items (ProductList):
```json
{
  "id": 1, "name": "...", "sku": "...",
  "category": "...", "unit_price": "99.99",
  "stock_quantity": 100, "is_active": true
}
```

### Create
```
POST /api/v1/products/
```
Body:
```json
{
  "supplier_id": 1,
  "warehouse_id": 1,
  "name": "string",
  "sku": "string",
  "description": "string",
  "category": "string",
  "unit_price": 99.99,
  "weight_kg": 1.5,
  "length_cm": 10.0,
  "width_cm": 5.0,
  "height_cm": 3.0,
  "stock_quantity": 100,
  "is_active": true
}
```
Validations: `unit_price`, `weight_kg`, `length_cm`, `width_cm`, `height_cm` all must be > 0.
Response: ProductDetail

### Retrieve
```
GET /api/v1/products/{id}/
```
Response: ProductDetail (with nested supplier and warehouse objects)

### Update
```
PUT  /api/v1/products/{id}/
PATCH /api/v1/products/{id}/
```

### Delete
```
DELETE /api/v1/products/{id}/
```
Response: 204 No Content
