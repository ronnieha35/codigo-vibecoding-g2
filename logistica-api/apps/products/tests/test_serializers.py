from decimal import Decimal

from django.test import TestCase

from apps.products.models import Product
from apps.products.serializers import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductWriteSerializerTests(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='HP Inc. Colombia',
            email='distribuciones@hp.com.co',
            phone='+57 601 555 0300',
            address='Cra 7 #73-55, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-800987654-2',
            contact_name='María Fernández',
        )
        self.warehouse = Warehouse.objects.create(
            name='CEDI Medellín Sur',
            address='Calle 30 Sur #41-80, Medellín',
            city='Medellín',
            country='Colombia',
            phone='+57 604 555 0400',
            capacity_m3=Decimal('1800.00'),
        )
        self.valid_data = {
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
            'name': 'HP ZBook Studio G9',
            'sku': 'SKU-HP-ZBOOK-G9-001',
            'description': 'Workstation móvil 15.6" OLED Intel Core i9',
            'category': 'workstations',
            'unit_price': '3299.99',
            'weight_kg': '1.980',
            'length_cm': '36.10',
            'width_cm': '24.50',
            'height_cm': '1.75',
            'stock_quantity': 10,
            'is_active': True,
        }

    # ── Happy path ──────────────────────────────────────────────────────────

    def test_valid_data_is_valid(self):
        """Datos completos y correctos → is_valid() True."""
        serializer = ProductWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_object_in_db(self):
        """is_valid() True → .save() crea objeto en BD."""
        serializer = ProductWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
        self.assertIsNotNone(product.pk)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(product.name, 'HP ZBook Studio G9')
        self.assertEqual(product.sku, 'SKU-HP-ZBOOK-G9-001')

    def test_valid_data_without_optional_fields(self):
        """Datos solo con campos requeridos (sin warehouse, decimales opcionales) → is_valid() True."""
        minimal_data = {
            'supplier': self.supplier.pk,
            'name': 'Logitech MX Master 3S',
            'sku': 'SKU-LOGI-MX3S-001',
        }
        serializer = ProductWriteSerializer(data=minimal_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_partial_update_only_name(self):
        """Actualización parcial (partial=True) con solo el nombre → is_valid() True."""
        product = Product.objects.create(
            supplier=self.supplier,
            name='Lenovo IdeaPad Slim 5',
            sku='SKU-LENOVO-IPS5-001',
        )
        serializer = ProductWriteSerializer(
            instance=product,
            data={'name': 'Lenovo IdeaPad Slim 5i'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.name, 'Lenovo IdeaPad Slim 5i')

    # ── Unhappy path ─────────────────────────────────────────────────────────

    def test_missing_name_is_invalid(self):
        """Campo name requerido faltante → is_valid() False con error en 'name'."""
        data = dict(self.valid_data)
        del data['name']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_supplier_is_invalid(self):
        """Campo supplier requerido faltante → is_valid() False con error en 'supplier'."""
        data = dict(self.valid_data)
        del data['supplier']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_missing_sku_is_invalid(self):
        """Campo sku requerido faltante → is_valid() False con error en 'sku'."""
        data = dict(self.valid_data)
        del data['sku']
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_duplicate_sku_is_invalid(self):
        """SKU duplicado → is_valid() False con error en 'sku'."""
        Product.objects.create(
            supplier=self.supplier,
            name='ASUS ROG Strix G15',
            sku='SKU-ASUS-ROGG15-001',
        )
        data = dict(self.valid_data)
        data['sku'] = 'SKU-ASUS-ROGG15-001'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_nonexistent_supplier_id_is_invalid(self):
        """FK supplier con ID que no existe → is_valid() False con error en 'supplier'."""
        data = dict(self.valid_data)
        data['supplier'] = 99999
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_nonexistent_warehouse_id_is_invalid(self):
        """FK warehouse con ID que no existe → is_valid() False con error en 'warehouse'."""
        data = dict(self.valid_data)
        data['warehouse'] = 99999
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    def test_unit_price_zero_is_invalid(self):
        """unit_price == 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['unit_price'] = '0.00'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_unit_price_negative_is_invalid(self):
        """unit_price < 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['unit_price'] = '-150.00'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_weight_kg_zero_is_invalid(self):
        """weight_kg == 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['weight_kg'] = '0.000'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight_kg', serializer.errors)

    def test_weight_kg_negative_is_invalid(self):
        """weight_kg < 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['weight_kg'] = '-1.500'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight_kg', serializer.errors)

    def test_length_cm_negative_is_invalid(self):
        """length_cm < 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['length_cm'] = '-10.00'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('length_cm', serializer.errors)

    def test_width_cm_negative_is_invalid(self):
        """width_cm < 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['width_cm'] = '-5.00'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('width_cm', serializer.errors)

    def test_height_cm_negative_is_invalid(self):
        """height_cm < 0 → is_valid() False por validación custom."""
        data = dict(self.valid_data)
        data['height_cm'] = '-2.00'
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('height_cm', serializer.errors)

    # ── Edge cases ────────────────────────────────────────────────────────────

    def test_blank_name_is_invalid(self):
        """String vacío en campo name → is_valid() False."""
        data = dict(self.valid_data)
        data['name'] = ''
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_blank_sku_is_invalid(self):
        """String vacío en campo sku → is_valid() False."""
        data = dict(self.valid_data)
        data['sku'] = ''
        serializer = ProductWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_none_warehouse_is_valid(self):
        """warehouse=None es válido (campo nullable)."""
        data = dict(self.valid_data)
        data['warehouse'] = None
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unit_price_positive_value_is_valid(self):
        """unit_price > 0 → validación custom pasa."""
        data = dict(self.valid_data)
        data['unit_price'] = '0.01'
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_optional_dimension_fields_can_be_null(self):
        """Campos de dimensión son opcionales y pueden omitirse."""
        data = dict(self.valid_data)
        del data['length_cm']
        del data['width_cm']
        del data['height_cm']
        serializer = ProductWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class ProductListSerializerTests(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Acer Colombia S.A.S.',
            email='ventas@acer.com.co',
            phone='+57 601 555 0500',
            tax_id='NIT-700111222-3',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            name='Acer Predator Helios 300',
            sku='SKU-ACER-PH300-001',
            category='laptops',
            unit_price=Decimal('1899.99'),
            stock_quantity=8,
            is_active=True,
        )

    def test_list_serializer_fields(self):
        """ProductListSerializer expone solo campos clave de lista."""
        serializer = ProductListSerializer(instance=self.product)
        expected_fields = {'id', 'name', 'sku', 'category', 'unit_price', 'stock_quantity', 'is_active'}
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_list_serializer_does_not_expose_supplier_detail(self):
        """ProductListSerializer NO expone detalles de supplier (solo en detail)."""
        serializer = ProductListSerializer(instance=self.product)
        self.assertNotIn('supplier', serializer.data)
        self.assertNotIn('description', serializer.data)
        self.assertNotIn('weight_kg', serializer.data)


class ProductDetailSerializerTests(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Toshiba Electronics S.A.',
            email='ventas@toshiba-latam.com',
            phone='+57 601 555 0600',
            tax_id='NIT-600333444-4',
        )
        self.warehouse = Warehouse.objects.create(
            name='CEDI Cali',
            address='Cra 1 #25-10, Cali',
            city='Cali',
            country='Colombia',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Toshiba Canvio Advance 2TB',
            sku='SKU-TOSH-CA2TB-001',
            description='Disco duro externo USB 3.0 2TB',
            category='storage',
            unit_price=Decimal('89.99'),
            weight_kg=Decimal('0.195'),
            stock_quantity=50,
        )

    def test_detail_serializer_exposes_all_fields(self):
        """ProductDetailSerializer expone todos los campos incluyendo relaciones."""
        serializer = ProductDetailSerializer(instance=self.product)
        expected_fields = {
            'id', 'supplier', 'warehouse', 'name', 'sku', 'description',
            'category', 'unit_price', 'weight_kg', 'length_cm', 'width_cm',
            'height_cm', 'stock_quantity', 'is_active', 'created_at', 'updated_at',
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_detail_serializer_supplier_nested(self):
        """supplier aparece como objeto anidado con id y name."""
        serializer = ProductDetailSerializer(instance=self.product)
        supplier_data = serializer.data['supplier']
        self.assertEqual(supplier_data['id'], self.supplier.pk)
        self.assertEqual(supplier_data['name'], 'Toshiba Electronics S.A.')

    def test_detail_serializer_warehouse_nested(self):
        """warehouse aparece como objeto anidado con id, name y city."""
        serializer = ProductDetailSerializer(instance=self.product)
        warehouse_data = serializer.data['warehouse']
        self.assertEqual(warehouse_data['id'], self.warehouse.pk)
        self.assertEqual(warehouse_data['name'], 'CEDI Cali')
        self.assertEqual(warehouse_data['city'], 'Cali')

    def test_detail_serializer_warehouse_none_when_not_assigned(self):
        """warehouse es None en detail cuando el producto no tiene almacén asignado."""
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=None,
            name='Kingston DataTraveler 128GB',
            sku='SKU-KING-DT128-001',
        )
        serializer = ProductDetailSerializer(instance=product)
        self.assertIsNone(serializer.data['warehouse'])
