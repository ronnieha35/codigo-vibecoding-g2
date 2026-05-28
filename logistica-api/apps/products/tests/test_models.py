from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductModelTests(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Dell Technologies S.A.',
            email='ventas@dell.com',
            phone='+57 601 555 0100',
            address='Av. El Dorado 68C-61, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-900123456-1',
            contact_name='Carlos Ramírez',
        )
        self.warehouse = Warehouse.objects.create(
            name='CEDI Bogotá Norte',
            address='Calle 170 #15-20, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 555 0200',
            capacity_m3=Decimal('2500.00'),
        )

    # ── Happy path ──────────────────────────────────────────────────────────

    def test_create_product_with_all_fields(self):
        """Crear producto con todos los campos → objeto guardado en BD."""
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Dell Latitude 5540',
            sku='SKU-DELL-LAT5540-001',
            description='Laptop empresarial 15.6" Intel Core i7',
            category='laptops',
            unit_price=Decimal('2499.99'),
            weight_kg=Decimal('1.850'),
            length_cm=Decimal('35.80'),
            width_cm=Decimal('23.60'),
            height_cm=Decimal('1.90'),
            stock_quantity=25,
            is_active=True,
        )
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(product.name, 'Dell Latitude 5540')
        self.assertEqual(product.sku, 'SKU-DELL-LAT5540-001')
        self.assertEqual(product.unit_price, Decimal('2499.99'))
        self.assertEqual(product.weight_kg, Decimal('1.850'))
        self.assertEqual(product.stock_quantity, 25)
        self.assertEqual(product.supplier, self.supplier)
        self.assertEqual(product.warehouse, self.warehouse)

    def test_str_returns_name_and_sku(self):
        """__str__ retorna 'nombre (sku)'."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Cisco Catalyst 9200L',
            sku='SKU-CISCO-C9200L-001',
        )
        self.assertEqual(str(product), 'Cisco Catalyst 9200L (SKU-CISCO-C9200L-001)')

    def test_create_product_without_optional_warehouse(self):
        """Crear producto sin warehouse → campo warehouse es None."""
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=None,
            name='HP ProLiant DL380 Gen10',
            sku='SKU-HP-DL380-G10-001',
        )
        self.assertIsNone(product.warehouse)
        self.assertEqual(Product.objects.count(), 1)

    def test_default_stock_quantity_is_zero(self):
        """stock_quantity tiene default=0 cuando no se especifica."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Lenovo ThinkPad X1 Carbon',
            sku='SKU-LENOVO-X1C-001',
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_default_is_active_is_true(self):
        """is_active tiene default=True cuando no se especifica."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Samsung 970 EVO Plus 1TB',
            sku='SKU-SAM-970EVO-1TB-001',
        )
        self.assertTrue(product.is_active)

    # ── Unhappy path ─────────────────────────────────────────────────────────

    def test_duplicate_sku_raises_integrity_error(self):
        """Crear dos productos con el mismo SKU → IntegrityError."""
        Product.objects.create(
            supplier=self.supplier,
            name='Dell PowerEdge R640',
            sku='SKU-DELL-R640-001',
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                name='Dell PowerEdge R640 Refurbished',
                sku='SKU-DELL-R640-001',
            )

    def test_create_product_without_supplier_raises_integrity_error(self):
        """Crear producto sin supplier → IntegrityError (NOT NULL en FK)."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='Ubiquiti UniFi AP AC Pro',
                sku='SKU-UBNT-UAPACPRO-001',
            )

    def test_create_product_without_name_raises_integrity_error(self):
        """Crear producto sin name → IntegrityError (NOT NULL en CharField)."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                name=None,
                sku='SKU-MISSING-NAME-001',
            )

    # ── Edge cases ────────────────────────────────────────────────────────────

    def test_fk_supplier_cascade_delete_removes_product(self):
        """Eliminar supplier con on_delete=CASCADE → producto eliminado."""
        Product.objects.create(
            supplier=self.supplier,
            name='Netgear ProSAFE XS708T',
            sku='SKU-NETGEAR-XS708T-001',
        )
        self.assertEqual(Product.objects.count(), 1)
        self.supplier.delete()
        self.assertEqual(Product.objects.count(), 0)

    def test_fk_warehouse_set_null_on_delete(self):
        """Eliminar warehouse con on_delete=SET_NULL → campo warehouse queda null."""
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='APC Smart-UPS 1500VA',
            sku='SKU-APC-SMT1500-001',
        )
        self.warehouse.delete()
        product.refresh_from_db()
        self.assertIsNone(product.warehouse)

    def test_decimal_fields_stored_with_correct_precision(self):
        """Campos decimales se almacenan con la precisión correcta."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Seagate Exos X18 16TB',
            sku='SKU-SEA-X18-16TB-001',
            unit_price=Decimal('349.50'),
            weight_kg=Decimal('0.780'),
            length_cm=Decimal('14.70'),
            width_cm=Decimal('10.16'),
            height_cm=Decimal('2.62'),
        )
        product.refresh_from_db()
        self.assertEqual(product.unit_price, Decimal('349.50'))
        self.assertEqual(product.weight_kg, Decimal('0.780'))
        self.assertEqual(product.length_cm, Decimal('14.70'))

    def test_description_allows_blank(self):
        """description permite blank — no es requerido."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Kingston 32GB DDR5',
            sku='SKU-KING-DDR5-32G-001',
            description='',
        )
        self.assertEqual(product.description, '')

    def test_created_at_and_updated_at_auto_populated(self):
        """BaseModel rellena created_at y updated_at automáticamente."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='ASUS ProArt Display PA279CV',
            sku='SKU-ASUS-PA279CV-001',
        )
        self.assertIsNotNone(product.created_at)
        self.assertIsNotNone(product.updated_at)
