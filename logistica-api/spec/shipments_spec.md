# Spec: Shipments

## Información del módulo
- **App Django:** `apps/shipments/`
- **Tabla(s) en BD:** `shipments_shipment`, `shipments_shipmentitem`, `shipments_shipmentstatushistory`
- **Dependencias:** `customers` ✅, `warehouses` ✅, `drivers` ✅, `transport` ✅, `routes` ✅, `products` ✅

---

## Modelos

### Shipment ⭐
Tabla: `shipments_shipment` — Hereda de `BaseModel`

| Campo | Tipo | Parámetros |
|---|---|---|
| `customer` | FK(customers.Customer) | CASCADE |
| `origin_warehouse` | FK(warehouses.Warehouse) | CASCADE |
| `driver` | FK(drivers.Driver) | SET_NULL, null, blank |
| `transport` | FK(transport.Transport) | SET_NULL, null, blank |
| `route` | FK(routes.Route) | SET_NULL, null, blank |
| `destination_address` | TextField | — |
| `destination_city` | CharField(100) | blank |
| `destination_country` | CharField(100) | blank |
| `status` | CharField(15) | choices=ShipmentStatus, default=PENDING |
| `scheduled_date` | DateField | null, blank |
| `delivered_at` | DateTimeField | null, blank |
| `shipping_cost` | DecimalField(10,2) | null, blank |
| `total_weight_kg` | DecimalField(10,3) | null, blank |
| `notes` | TextField | blank |

### ShipmentItem
Tabla: `shipments_shipmentitem` — No hereda BaseModel

| Campo | Tipo | Parámetros |
|---|---|---|
| `shipment` | FK(Shipment) | CASCADE, related_name='items' |
| `product` | FK(products.Product) | CASCADE |
| `quantity` | PositiveIntegerField | — |
| `unit_price` | DecimalField(10,2) | null, blank |

### ShipmentStatusHistory
Tabla: `shipments_shipmentstatushistory` — No hereda BaseModel

| Campo | Tipo | Parámetros |
|---|---|---|
| `shipment` | FK(Shipment) | CASCADE, related_name='status_history' |
| `status` | CharField(15) | choices=ShipmentStatus |
| `changed_at` | DateTimeField | auto_now_add=True |
| `changed_by` | FK(AUTH_USER_MODEL) | SET_NULL, null, blank |
| `notes` | TextField | blank |

---

## Serializers

Nested helpers (read-only): CustomerMinimal, WarehouseMinimal, DriverMinimal, TransportMinimal, RouteMinimal, ProductMinimal, UserMinimal

ShipmentItemNestedSerializer, ShipmentItemWriteSerializer, ShipmentStatusHistorySerializer
ShipmentListSerializer, ShipmentDetailSerializer, ShipmentWriteSerializer

create: pop items → create Shipment → create items → create ShipmentStatusHistory(PENDING)
update: track old_status → update → if status changed create history → if items not None replace

---

## Lista de tareas

1-11: estándar (startapp → models → migrations → serializers → views → urls → admin)
