# Spec: Products

## Información del módulo
- **App Django:** `apps/products/`
- **Tabla en BD:** `products_product`
- **Dependencias:** `suppliers` ✅, `warehouses` ✅

---

## Modelo

### Product
Tabla: `products_product`
Hereda de: `apps.core.models.BaseModel` (provee `created_at`, `updated_at`)

| Campo | Tipo Django | Parámetros | Descripción |
|---|---|---|---|
| `supplier` | `ForeignKey('apps.suppliers.Supplier')` | `on_delete=CASCADE` | Proveedor del producto |
| `warehouse` | `ForeignKey('apps.warehouses.Warehouse')` | `on_delete=SET_NULL, null=True, blank=True` | Almacén donde está guardado |
| `name` | `CharField(200)` | — | — |
| `sku` | `CharField(100)` | `unique=True` | Código interno |
| `description` | `TextField` | `blank=True` | — |
| `category` | `CharField(100)` | `blank=True` | ej: laptops, smartphones, peripherals |
| `unit_price` | `DecimalField(10,2)` | `null=True, blank=True` | Precio de venta unitario |
| `weight_kg` | `DecimalField(8,3)` | `null=True, blank=True` | Peso en kg |
| `length_cm` | `DecimalField(8,2)` | `null=True, blank=True` | Dimensión largo |
| `width_cm` | `DecimalField(8,2)` | `null=True, blank=True` | Dimensión ancho |
| `height_cm` | `DecimalField(8,2)` | `null=True, blank=True` | Dimensión alto |
| `stock_quantity` | `PositiveIntegerField` | `default=0` | Unidades en stock |
| `is_active` | `BooleanField` | `default=True` | — |

---

## Serializers

### ProductListSerializer
Campos: `id`, `name`, `sku`, `category`, `unit_price`, `stock_quantity`, `is_active`

### ProductDetailSerializer
Campos: todos + `supplier` expandido (`id`, `name`) + `warehouse` expandido (`id`, `name`, `city`)

### ProductWriteSerializer
Campos: `supplier`, `warehouse`, `name`, `sku`, `description`, `category`, `unit_price`,
`weight_kg`, `length_cm`, `width_cm`, `height_cm`, `stock_quantity`, `is_active`
Validaciones:
- `unit_price` debe ser positivo si se provee
- `weight_kg`, `length_cm`, `width_cm`, `height_cm` deben ser positivos si se proveen
- `stock_quantity` no puede ser negativo (cubierto por `PositiveIntegerField`)

---

## ViewSet

Clase: `ProductViewSet(ModelViewSet)`
Queryset: `Product.objects.select_related('supplier', 'warehouse').filter(is_active=True)`
Permisos: `[IsAuthenticated]`
Serializer por acción: `list` → List, `retrieve` → Detail, `create/update/partial_update` → Write

### Endpoints generados
| Método | URL | Acción |
|---|---|---|
| GET | `/api/v1/products/` | list |
| POST | `/api/v1/products/` | create |
| GET | `/api/v1/products/{id}/` | retrieve |
| PUT | `/api/v1/products/{id}/` | update |
| PATCH | `/api/v1/products/{id}/` | partial_update |
| DELETE | `/api/v1/products/{id}/` | destroy |

---

## URLs

Archivo: `apps/products/urls.py`
Router: `DefaultRouter()`
Registro: `router.register(r'products', ProductViewSet)`

---

## Admin

Archivo: `apps/products/admin.py`
`list_display`: `['id', 'name', 'sku', 'category', 'supplier', 'stock_quantity', 'is_active']`
`list_filter`: `['is_active', 'category', 'supplier']`
`search_fields`: `['name', 'sku']`

---

## Lista de tareas para Implement

> Nota: `apps/products/` ya existe desde Fase 0. No correr `startapp`.

1. [ ] Agregar `'apps.products'` a `INSTALLED_APPS` en `config/settings/base.py`
2. [ ] Implementar `Product` en `apps/products/models.py` heredando de `BaseModel`
3. [ ] `python manage.py makemigrations products`
4. [ ] `python manage.py migrate`
5. [ ] Crear `apps/products/serializers.py` con List, Detail (nested), Write
6. [ ] Crear `ProductViewSet` en `apps/products/views.py`
7. [ ] Crear `apps/products/urls.py` con DefaultRouter
8. [ ] Incluir en `config/urls.py`: `path('api/v1/', include('apps.products.urls'))`
9. [ ] Registrar en `apps/products/admin.py`
