"""
Tests de serializers para el módulo shipments.
Cubre: ShipmentWriteSerializer, ShipmentItemWriteSerializer, ShipmentStatusHistorySerializer.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, RequestFactory

from apps.customers.models import Customer
from apps.drivers.models import Driver
from apps.products.models import Product
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentItem, ShipmentStatus, ShipmentStatusHistory
from apps.shipments.serializers import (
    ShipmentDetailSerializer,
    ShipmentItemWriteSerializer,
    ShipmentListSerializer,
    ShipmentStatusHistorySerializer,
    ShipmentWriteSerializer,
)
from apps.suppliers.models import Supplier
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


class ShipmentSerializerFixtureMixin:
    """Crea todos los fixtures de dependencia para serializers de Shipment."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Importaciones TechStar Colombia',
            email='compras@techstar.com.co',
            phone='+57 601 333 4455',
            address='Autopista Norte #108-27, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='900.222.333-4',
            contact_name='Paola Montoya',
        )
        self.warehouse = Warehouse.objects.create(
            name='Centro Logístico Fontibón',
            address='Avenida Esperanza #25-10, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 777 8899',
            capacity_m3=Decimal('3000.00'),
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Monitor Samsung 27" 4K',
            sku='SKU-SAM-MON-27-001',
            category='monitores',
            unit_price=Decimal('1199.99'),
            weight_kg=Decimal('4.200'),
            stock_quantity=15,
        )
        self.customer = Customer.objects.create(
            name='Soluciones Digitales S.A.',
            customer_type=Customer.CustomerType.COMPANY,
            email='compras@solucionesdigitales.com.co',
            phone='+57 311 222 3344',
            address='Calle 93 #15-20, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='900.444.555-6',
        )
        self.transport = Transport.objects.create(
            name='Furgoneta Sprinter Bogotá Sur',
            license_plate='BOG-456',
            vehicle_type=Transport.VehicleType.VAN,
            capacity_kg=Decimal('2000.00'),
            capacity_m3=Decimal('12.00'),
        )
        self.driver_user = User.objects.create_user(
            username='david.martinez',
            password='SecurePass123!',
            first_name='David',
            last_name='Martínez',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            transport=self.transport,
            license_number='COL-B2-30405060',
            phone='+57 320 300 4050',
        )
        self.route = Route.objects.create(
            name='Bogotá - Cali Principal',
            origin_warehouse=self.warehouse,
            description='Ruta principal Bogotá-Cali por la vía Panamericana.',
            estimated_duration_hours=Decimal('9.00'),
        )

        # Shipment existente para tests de update
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Carrera 5 #10-20, Cali, Valle del Cauca',
            destination_city='Cali',
            destination_country='Colombia',
        )

        # Request simulado con usuario autenticado
        self.factory = RequestFactory()
        self.request_user = User.objects.create_user(
            username='api.tester',
            password='SecurePass123!',
        )
        self.mock_request = self.factory.post('/')
        self.mock_request.user = self.request_user


class ShipmentItemWriteSerializerTests(ShipmentSerializerFixtureMixin, TestCase):
    """Tests del serializer de escritura para ShipmentItem."""

    # -------------------------
    # Happy path
    # -------------------------

    def test_valid_item_data_is_valid(self):
        """Datos completos válidos → is_valid() True."""
        data = {
            'product': self.product.pk,
            'quantity': 3,
            'unit_price': '1199.99',
        }
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_item_without_unit_price_is_valid(self):
        """unit_price es opcional — datos sin él son válidos."""
        data = {
            'product': self.product.pk,
            'quantity': 5,
        }
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_missing_product_is_invalid(self):
        """Omitir product → is_valid() False."""
        data = {'quantity': 2}
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_missing_quantity_is_invalid(self):
        """Omitir quantity → is_valid() False."""
        data = {'product': self.product.pk}
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_nonexistent_product_is_invalid(self):
        """product FK inexistente → is_valid() False."""
        data = {'product': 99999, 'quantity': 1}
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_zero_quantity_is_invalid(self):
        """quantity=0 viola min_value=1 → is_valid() False."""
        data = {'product': self.product.pk, 'quantity': 0}
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_negative_quantity_is_invalid(self):
        """quantity negativo viola min_value=1 → is_valid() False."""
        data = {'product': self.product.pk, 'quantity': -5}
        serializer = ShipmentItemWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)


class ShipmentWriteSerializerTests(ShipmentSerializerFixtureMixin, TestCase):
    """Tests del serializer de escritura para Shipment."""

    def _get_base_data(self):
        return {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Calle 10 #20-30, Cali, Valle del Cauca',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
        }

    # -------------------------
    # Happy path
    # -------------------------

    def test_valid_data_is_valid(self):
        """Datos mínimos requeridos → is_valid() True."""
        serializer = ShipmentWriteSerializer(
            data=self._get_base_data(),
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_shipment(self):
        """is_valid() True → .save() crea Shipment en BD."""
        serializer = ShipmentWriteSerializer(
            data=self._get_base_data(),
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid())
        shipment = serializer.save()
        self.assertIsNotNone(shipment.pk)
        self.assertTrue(Shipment.objects.filter(pk=shipment.pk).exists())

    def test_create_automatically_creates_status_history(self):
        """Al crear un shipment, se genera automáticamente un ShipmentStatusHistory."""
        serializer = ShipmentWriteSerializer(
            data=self._get_base_data(),
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid())
        shipment = serializer.save()
        history_count = ShipmentStatusHistory.objects.filter(shipment=shipment).count()
        self.assertEqual(history_count, 1)

    def test_create_with_items_creates_shipment_items(self):
        """Crear con items → ShipmentItem creados en BD."""
        data = {
            **self._get_base_data(),
            'items': [
                {'product': self.product.pk, 'quantity': 2, 'unit_price': '1199.99'},
            ],
        }
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        shipment = serializer.save()
        self.assertEqual(shipment.items.count(), 1)

    def test_create_with_all_optional_fields(self):
        """Datos con todos los campos opcionales → is_valid() True."""
        data = {
            **self._get_base_data(),
            'driver': self.driver.pk,
            'transport': self.transport.pk,
            'route': self.route.pk,
            'status': ShipmentStatus.ASSIGNED,
            'scheduled_date': '2026-07-01',
            'shipping_cost': '175000.00',
            'total_weight_kg': '4.200',
            'notes': 'Entregar en horario de oficina.',
        }
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_creates_history_when_status_changes(self):
        """PATCH con cambio de status → nuevo ShipmentStatusHistory creado."""
        # Borrar historia previa del shipment de setUp
        ShipmentStatusHistory.objects.filter(shipment=self.shipment).delete()

        serializer = ShipmentWriteSerializer(
            instance=self.shipment,
            data={'status': ShipmentStatus.IN_TRANSIT},
            partial=True,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        history_count = ShipmentStatusHistory.objects.filter(shipment=self.shipment).count()
        self.assertEqual(history_count, 1)

    def test_update_without_status_change_does_not_create_history(self):
        """PATCH sin cambio de status → no se crea entrada de historial adicional."""
        # Limpiar historia previa
        ShipmentStatusHistory.objects.filter(shipment=self.shipment).delete()

        serializer = ShipmentWriteSerializer(
            instance=self.shipment,
            data={'notes': 'Actualización de notas sin cambio de estado.'},
            partial=True,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        history_count = ShipmentStatusHistory.objects.filter(shipment=self.shipment).count()
        self.assertEqual(history_count, 0)

    def test_update_with_items_replaces_existing_items(self):
        """PATCH con items → items existentes eliminados y reemplazados."""
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
        )
        new_data = {
            'items': [
                {'product': self.product.pk, 'quantity': 10},
            ],
        }
        serializer = ShipmentWriteSerializer(
            instance=self.shipment,
            data=new_data,
            partial=True,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        items = ShipmentItem.objects.filter(shipment=self.shipment)
        self.assertEqual(items.count(), 1)
        self.assertEqual(items.first().quantity, 10)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_missing_customer_is_invalid(self):
        """Omitir customer → is_valid() False con error en 'customer'."""
        data = {**self._get_base_data()}
        del data['customer']
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_missing_origin_warehouse_is_invalid(self):
        """Omitir origin_warehouse → is_valid() False con error en 'origin_warehouse'."""
        data = {**self._get_base_data()}
        del data['origin_warehouse']
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_missing_destination_address_is_invalid(self):
        """Omitir destination_address → is_valid() False."""
        data = {**self._get_base_data()}
        del data['destination_address']
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_address', serializer.errors)

    def test_nonexistent_customer_is_invalid(self):
        """customer FK inexistente → is_valid() False."""
        data = {**self._get_base_data(), 'customer': 99999}
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_nonexistent_origin_warehouse_is_invalid(self):
        """origin_warehouse FK inexistente → is_valid() False."""
        data = {**self._get_base_data(), 'origin_warehouse': 99999}
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_invalid_status_choice_is_invalid(self):
        """status con valor fuera de choices → is_valid() False."""
        data = {**self._get_base_data(), 'status': 'ENVIANDO'}
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_nonexistent_driver_is_invalid(self):
        """driver FK inexistente → is_valid() False."""
        data = {**self._get_base_data(), 'driver': 99999}
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('driver', serializer.errors)

    # -------------------------
    # Edge cases
    # -------------------------

    def test_blank_destination_address_is_invalid(self):
        """destination_address vacío '' → is_valid() False (TextField requerido)."""
        data = {**self._get_base_data(), 'destination_address': ''}
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_address', serializer.errors)

    def test_items_with_nonexistent_product_is_invalid(self):
        """Item con product FK inexistente → is_valid() False."""
        data = {
            **self._get_base_data(),
            'items': [{'product': 99999, 'quantity': 1}],
        }
        serializer = ShipmentWriteSerializer(
            data=data,
            context={'request': self.mock_request},
        )
        self.assertFalse(serializer.is_valid())

    def test_update_without_items_does_not_delete_existing_items(self):
        """PATCH sin campo 'items' → items existentes no se eliminan."""
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=4,
        )
        serializer = ShipmentWriteSerializer(
            instance=self.shipment,
            data={'notes': 'Nota sin tocar items.'},
            partial=True,
            context={'request': self.mock_request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.assertEqual(ShipmentItem.objects.filter(shipment=self.shipment).count(), 1)


class ShipmentListSerializerTests(ShipmentSerializerFixtureMixin, TestCase):
    """Tests del ShipmentListSerializer (solo lectura)."""

    def test_list_serializer_contains_expected_fields(self):
        """ShipmentListSerializer incluye los campos de lista definidos."""
        serializer = ShipmentListSerializer(self.shipment)
        expected_fields = {
            'id', 'customer', 'status', 'scheduled_date',
            'destination_city', 'destination_country',
            'shipping_cost', 'created_at',
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_list_serializer_customer_is_nested(self):
        """El campo customer en list serializer es un objeto con id y name."""
        serializer = ShipmentListSerializer(self.shipment)
        customer_data = serializer.data['customer']
        self.assertIn('id', customer_data)
        self.assertIn('name', customer_data)

    def test_list_serializer_does_not_contain_detail_fields(self):
        """ShipmentListSerializer NO incluye campos de detalle como 'items'."""
        serializer = ShipmentListSerializer(self.shipment)
        self.assertNotIn('items', serializer.data)
        self.assertNotIn('status_history', serializer.data)
        self.assertNotIn('origin_warehouse', serializer.data)


class ShipmentDetailSerializerTests(ShipmentSerializerFixtureMixin, TestCase):
    """Tests del ShipmentDetailSerializer (solo lectura)."""

    def test_detail_serializer_contains_all_fields(self):
        """ShipmentDetailSerializer incluye todos los campos de detalle."""
        serializer = ShipmentDetailSerializer(self.shipment)
        detail_fields = {
            'id', 'customer', 'origin_warehouse', 'driver', 'transport', 'route',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'scheduled_date', 'delivered_at',
            'shipping_cost', 'total_weight_kg', 'notes',
            'items', 'status_history',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(serializer.data.keys()), detail_fields)

    def test_detail_has_more_fields_than_list(self):
        """Detail serializer tiene más campos que list serializer."""
        list_data = ShipmentListSerializer(self.shipment).data
        detail_data = ShipmentDetailSerializer(self.shipment).data
        self.assertGreater(len(detail_data.keys()), len(list_data.keys()))

    def test_detail_serializer_includes_items_and_status_history(self):
        """Detail serializer incluye items y status_history como listas."""
        serializer = ShipmentDetailSerializer(self.shipment)
        self.assertIn('items', serializer.data)
        self.assertIn('status_history', serializer.data)
        self.assertIsInstance(serializer.data['items'], list)
        self.assertIsInstance(serializer.data['status_history'], list)
