# Esquema de Base de Datos — Logística API

## Tablas Django built-in (referenciadas, no creadas)

| Tabla | Uso en este proyecto |
|---|---|
| `auth_user` | Credenciales de conductores y admins |
| `auth_group` | Grupos de permisos (admin, driver, customer) |
| `auth_permission` | Permisos granulares por módulo |

---

## `customers_customer`
Empresa o persona que genera envíos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `user` | FK → `auth_user` | null, blank | Login opcional para el cliente |
| `name` | CharField(200) | NOT NULL | Nombre empresa o persona |
| `customer_type` | CharField(10) | choices: PERSON / COMPANY | Tipo de cliente |
| `email` | EmailField | unique | — |
| `phone` | CharField(20) | — | — |
| `address` | TextField | — | Dirección completa |
| `city` | CharField(100) | — | — |
| `country` | CharField(100) | — | — |
| `tax_id` | CharField(50) | unique, null | RUC / DNI |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `suppliers_supplier`
Empresas que venden los productos tecnológicos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `name` | CharField(200) | NOT NULL | Razón social |
| `email` | EmailField | unique | — |
| `phone` | CharField(20) | — | — |
| `address` | TextField | — | — |
| `city` | CharField(100) | — | — |
| `country` | CharField(100) | — | — |
| `tax_id` | CharField(50) | unique | RUC de la empresa |
| `contact_name` | CharField(200) | — | Persona de contacto |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `warehouses_warehouse`
Puntos de partida y almacenamiento de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `name` | CharField(200) | NOT NULL | Nombre del almacén |
| `address` | TextField | — | — |
| `city` | CharField(100) | — | — |
| `country` | CharField(100) | — | — |
| `phone` | CharField(20) | — | — |
| `capacity_m3` | DecimalField(8,2) | — | Capacidad total en m³ |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `products_product`
Productos tecnológicos almacenados y enviados.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `supplier` | FK → `suppliers_supplier` | CASCADE | Proveedor del producto |
| `warehouse` | FK → `warehouses_warehouse` | SET_NULL, null | Almacén donde está guardado |
| `name` | CharField(200) | NOT NULL | — |
| `sku` | CharField(100) | unique | Código interno |
| `description` | TextField | blank | — |
| `category` | CharField(100) | — | ej: laptops, smartphones, peripherals |
| `unit_price` | DecimalField(10,2) | — | Precio de venta unitario |
| `weight_kg` | DecimalField(8,3) | — | Peso en kg |
| `length_cm` | DecimalField(8,2) | — | Dimensión largo |
| `width_cm` | DecimalField(8,2) | — | Dimensión ancho |
| `height_cm` | DecimalField(8,2) | — | Dimensión alto |
| `stock_quantity` | PositiveIntegerField | default=0 | Unidades en stock |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `transport_transport`
Vehículos para la entrega de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `name` | CharField(200) | NOT NULL | Nombre / descripción del vehículo |
| `license_plate` | CharField(20) | unique | Placa |
| `vehicle_type` | CharField(15) | choices: TRUCK / VAN / MOTORCYCLE / OTHER | Tipo de vehículo |
| `capacity_kg` | DecimalField(10,2) | — | Carga máxima en kg |
| `capacity_m3` | DecimalField(8,2) | — | Volumen máximo en m³ |
| `is_available` | BooleanField | default=True | Libre para asignar |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `drivers_driver`
Conductores asignados al transporte.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `user` | OneToOneField → `auth_user` | CASCADE | Credenciales de acceso |
| `transport` | FK → `transport_transport` | SET_NULL, null | Vehículo actualmente asignado |
| `license_number` | CharField(50) | unique | Número de licencia de conducir |
| `phone` | CharField(20) | — | — |
| `is_available` | BooleanField | default=True | Disponible para nueva asignación |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `routes_route`
Secuencia de paradas del transporte.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `name` | CharField(200) | NOT NULL | Nombre de la ruta |
| `origin_warehouse` | FK → `warehouses_warehouse` | CASCADE | Almacén de salida |
| `description` | TextField | blank | — |
| `estimated_duration_hours` | DecimalField(5,2) | — | Duración estimada total |
| `is_active` | BooleanField | default=True | — |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

---

## `routes_routestop`
Paradas intermedias de una ruta.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `route` | FK → `routes_route` | CASCADE | Ruta a la que pertenece |
| `warehouse` | FK → `warehouses_warehouse` | CASCADE | Almacén de la parada |
| `stop_order` | PositiveSmallIntegerField | — | Orden de la parada en la ruta |
| `estimated_duration_minutes` | PositiveIntegerField | — | Tiempo estimado en esta parada |

Índice único: `(route, stop_order)` — no puede haber dos paradas en la misma posición.

---

## `shipments_shipment` ⭐ Tabla central

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `customer` | FK → `customers_customer` | CASCADE | Cliente que genera el envío |
| `origin_warehouse` | FK → `warehouses_warehouse` | CASCADE | Almacén de origen |
| `driver` | FK → `drivers_driver` | SET_NULL, null | Asignado al confirmar |
| `transport` | FK → `transport_transport` | SET_NULL, null | Asignado al confirmar |
| `route` | FK → `routes_route` | SET_NULL, null | Ruta asignada (opcional) |
| `destination_address` | TextField | NOT NULL | Dirección de entrega |
| `destination_city` | CharField(100) | — | — |
| `destination_country` | CharField(100) | — | — |
| `status` | CharField(15) | choices ver abajo | Estado actual del envío |
| `scheduled_date` | DateField | — | Fecha programada de entrega |
| `delivered_at` | DateTimeField | null | Fecha/hora real de entrega |
| `shipping_cost` | DecimalField(10,2) | — | Costo calculado |
| `total_weight_kg` | DecimalField(10,3) | — | Peso total (suma de items) |
| `notes` | TextField | blank | Observaciones |
| `created_at` | DateTimeField | auto_now_add | — |
| `updated_at` | DateTimeField | auto_now | — |

**Estados del envío (`status`):**

| Valor | Descripción |
|---|---|
| `PENDING` | Creado, esperando asignación de conductor y transporte |
| `ASSIGNED` | Conductor y transporte asignados, listo para despacho |
| `IN_TRANSIT` | En camino al destino |
| `DELIVERED` | Entregado al cliente |
| `CANCELLED` | Cancelado |

---

## `shipments_shipmentitem`
Productos incluidos en un envío.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `shipment` | FK → `shipments_shipment` | CASCADE | — |
| `product` | FK → `products_product` | CASCADE | — |
| `quantity` | PositiveIntegerField | — | Unidades enviadas |
| `unit_price` | DecimalField(10,2) | — | Precio snapshot al momento del envío |

---

## `shipments_shipmentstatushistory`
Auditoría de cambios de estado de envíos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | AutoField | PK | — |
| `shipment` | FK → `shipments_shipment` | CASCADE | — |
| `status` | CharField(15) | choices igual que shipment | Estado registrado |
| `changed_at` | DateTimeField | auto_now_add | — |
| `changed_by` | FK → `auth_user` | SET_NULL, null | Usuario que realizó el cambio |
| `notes` | TextField | blank | Motivo del cambio |

---

## Diagrama de relaciones

```
auth_user ─────────────────────────────────────────┐
    │ (OneToOne)                                    │ FK changed_by
    ↓                                               ↓
drivers_driver ──────────────────── shipments_shipmentstatushistory
    │ FK transport                           │ FK shipment
    ↓                                        ↓
transport_transport              shipments_shipment
                                  │    │    │    │
                          FK customer  │  FK origin_warehouse
                                  │    │         │
                  customers_customer  FK route    ↓
                  │ FK user → auth_user  ↓   warehouses_warehouse
                                   routes_route        ↑
                                        │ FK origin_warehouse
                                        ↓
                                  routes_routestop
                                  │ FK warehouse ────────┘
                                  
shipments_shipmentitem
    │ FK shipment → shipments_shipment
    │ FK product
    ↓
products_product
    │ FK supplier → suppliers_supplier
    │ FK warehouse → warehouses_warehouse
```

---

## Resumen de apps Django

| App | Tablas propias |
|---|---|
| `customers` | `customers_customer` |
| `suppliers` | `suppliers_supplier` |
| `warehouses` | `warehouses_warehouse` |
| `products` | `products_product` |
| `transport` | `transport_transport` |
| `drivers` | `drivers_driver` |
| `routes` | `routes_route`, `routes_routestop` |
| `shipments` | `shipments_shipment`, `shipments_shipmentitem`, `shipments_shipmentstatushistory` |
