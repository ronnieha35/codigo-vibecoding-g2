"""
Tests de modelos para el módulo shipments.
Cubre: Shipment, ShipmentItem, ShipmentStatusHistory.
"""
import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer
from apps.drivers.models import Driver
from apps.products.models import Product
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentItem, ShipmentStatus, ShipmentStatusHistory
from apps.suppliers.models import Supplier
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


class ShipmentFixtureMixin:
    """Crea todos los fixtures necesarios para Shipment."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Tecnología Avanzada S.A.S.',
            email='ventas@tecavanzada.com.co',
            phone='+57 601 234 5678',
            address='Calle 72 #10-07, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='900.123.456-7',
            contact_name='Camilo Restrepo',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Central Bogotá',
            address='Calle 80 #45-12, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 555 1100',
            capacity_m3=Decimal('2500.00'),
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Laptop Dell Latitude 5540',
            sku='SKU-DELL-5540-001',
            category='laptops',
            unit_price=Decimal('3599.99'),
            weight_kg=Decimal('1.800'),
            stock_quantity=25,
        )
        self.customer = Customer.objects.create(
            name='Distribuidora TechColombia Ltda.',
            customer_type=Customer.CustomerType.COMPANY,
            email='pedidos@techcolombia.co',
            phone='+57 310 555 9900',
            address='Carrera 15 #85-32, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='830.500.123-1',
        )
        self.transport = Transport.objects.create(
            name='Camión NHR Isuzu Bogotá Norte',
            license_plate='BOG-123',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg=Decimal('5000.00'),
            capacity_m3=Decimal('30.00'),
        )
        self.driver_user = User.objects.create_user(
            username='carlos.gomez',
            password='SecurePass123!',
            first_name='Carlos',
            last_name='Gómez',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            transport=self.transport,
            license_number='COL-B2-20304050',
            phone='+57 315 200 3040',
        )
        self.route = Route.objects.create(
            name='Bogotá - Medellín Express',
            origin_warehouse=self.warehouse,
            description='Ruta directa sin escala.',
            estimated_duration_hours=Decimal('8.50'),
        )


class ShipmentModelTests(ShipmentFixtureMixin, TestCase):
    """Tests del modelo Shipment."""

    # -------------------------
    # Happy path
    # -------------------------

    def test_create_shipment_with_required_fields_only(self):
        """Creación con campos mínimos requeridos — customer y origin_warehouse."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Carrera 70 #45-90, Medellín, Antioquia',
        )
        self.assertIsNotNone(shipment.pk)
        self.assertEqual(shipment.status, ShipmentStatus.PENDING)
        self.assertIsNone(shipment.driver)
        self.assertIsNone(shipment.transport)
        self.assertIsNone(shipment.route)

    def test_create_shipment_with_all_fields(self):
        """Creación con todos los campos opcionales incluidos."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            driver=self.driver,
            transport=self.transport,
            route=self.route,
            destination_address='Avenida El Poblado #15-22, Medellín',
            destination_city='Medellín',
            destination_country='Colombia',
            status=ShipmentStatus.ASSIGNED,
            scheduled_date=datetime.date(2026, 6, 15),
            shipping_cost=Decimal('185000.00'),
            total_weight_kg=Decimal('3.600'),
            notes='Envío urgente — requiere firma del destinatario.',
        )
        self.assertEqual(shipment.destination_city, 'Medellín')
        self.assertEqual(shipment.status, ShipmentStatus.ASSIGNED)
        self.assertEqual(shipment.driver, self.driver)

    def test_str_returns_expected_format(self):
        """__str__ incluye el PK, nombre del cliente y el estado."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 100 #20-30, Barranquilla',
        )
        expected = f'Shipment #{shipment.pk} — {self.customer} ({shipment.status})'
        self.assertEqual(str(shipment), expected)

    def test_default_status_is_pending(self):
        """El estado por defecto al crear es PENDING."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 7 #20-10, Bogotá',
        )
        self.assertEqual(shipment.status, 'PENDING')

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_create_without_customer_raises_integrity_error(self):
        """Omitir customer → IntegrityError (NOT NULL constraint)."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                origin_warehouse=self.warehouse,
                destination_address='Cra 30 #12-45, Cali',
            )

    def test_create_without_origin_warehouse_raises_integrity_error(self):
        """Omitir origin_warehouse → IntegrityError (NOT NULL constraint)."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                customer=self.customer,
                destination_address='Cra 30 #12-45, Cali',
            )

    def test_invalid_status_choice_raises_validation_error(self):
        """Status con valor fuera de choices → ValidationError en full_clean()."""
        shipment = Shipment(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 30 #12-45, Cali',
            status='DESCONOCIDO',
        )
        with self.assertRaises(ValidationError):
            shipment.full_clean()

    # -------------------------
    # Edge cases — FK behavior
    # -------------------------

    def test_cascade_delete_when_customer_deleted(self):
        """Eliminar customer con CASCADE → shipment eliminado automáticamente."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 15 #85-32, Bogotá',
        )
        shipment_id = shipment.pk
        self.customer.delete()
        self.assertFalse(Shipment.objects.filter(pk=shipment_id).exists())

    def test_cascade_delete_when_origin_warehouse_deleted(self):
        """Eliminar origin_warehouse con CASCADE → shipment eliminado automáticamente."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 50 #30-10, Manizales',
        )
        shipment_id = shipment.pk
        self.warehouse.delete()
        self.assertFalse(Shipment.objects.filter(pk=shipment_id).exists())

    def test_set_null_when_driver_deleted(self):
        """Eliminar driver con SET_NULL → shipment.driver queda null."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            driver=self.driver,
            destination_address='Calle 10 #5-20, Pereira',
        )
        # Eliminar driver requiere eliminar el user asociado (CASCADE en Driver.user)
        self.driver_user.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.driver)

    def test_set_null_when_transport_deleted(self):
        """Eliminar transport con SET_NULL → shipment.transport queda null."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            transport=self.transport,
            destination_address='Cra 50 #20-15, Bucaramanga',
        )
        transport_id = self.transport.pk
        self.transport.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.transport)

    def test_set_null_when_route_deleted(self):
        """Eliminar route con SET_NULL → shipment.route queda null."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            route=self.route,
            destination_address='Cra 43 #5-113, Barranquilla',
        )
        self.route.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.route)

    def test_optional_fields_accept_null(self):
        """Campos opcionales permiten null correctamente."""
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 72 #10-07, Bogotá',
        )
        self.assertIsNone(shipment.scheduled_date)
        self.assertIsNone(shipment.delivered_at)
        self.assertIsNone(shipment.shipping_cost)
        self.assertIsNone(shipment.total_weight_kg)

    def test_valid_status_choices_accepted(self):
        """Todos los choices válidos pasan full_clean()."""
        valid_statuses = [
            ShipmentStatus.PENDING,
            ShipmentStatus.ASSIGNED,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.DELIVERED,
            ShipmentStatus.CANCELLED,
        ]
        for s in valid_statuses:
            shipment = Shipment(
                customer=self.customer,
                origin_warehouse=self.warehouse,
                destination_address='Calle 1 #1-1, Bogotá',
                status=s,
            )
            # no debe lanzar excepción
            shipment.full_clean()


class ShipmentItemModelTests(ShipmentFixtureMixin, TestCase):
    """Tests del modelo ShipmentItem."""

    def setUp(self):
        super().setUp()
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 70 #30-20, Medellín',
        )

    # -------------------------
    # Happy path
    # -------------------------

    def test_create_shipment_item_success(self):
        """Creación de ShipmentItem con campos válidos."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
            unit_price=Decimal('3599.99'),
        )
        self.assertIsNotNone(item.pk)
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.unit_price, Decimal('3599.99'))

    def test_str_returns_product_name_and_quantity(self):
        """__str__ retorna 'nombre_producto xCantidad'."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=5,
        )
        expected = f'{self.product.name} x5'
        self.assertEqual(str(item), expected)

    def test_create_item_without_unit_price(self):
        """unit_price es opcional (null, blank) — debe crearse sin él."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        self.assertIsNone(item.unit_price)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_create_item_without_shipment_raises_integrity_error(self):
        """Omitir shipment → IntegrityError."""
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                product=self.product,
                quantity=1,
            )

    def test_create_item_without_product_raises_integrity_error(self):
        """Omitir product → IntegrityError."""
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                quantity=1,
            )

    # -------------------------
    # Edge cases
    # -------------------------

    def test_cascade_delete_when_shipment_deleted(self):
        """Eliminar shipment → item eliminado en cascada."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        item_id = item.pk
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_cascade_delete_when_product_deleted(self):
        """Eliminar product → item eliminado en cascada."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
        )
        item_id = item.pk
        self.product.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_numeric_fields_with_valid_values(self):
        """Campos numéricos aceptan valores decimales correctos."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=10,
            unit_price=Decimal('1299.50'),
        )
        self.assertEqual(item.quantity, 10)
        self.assertEqual(item.unit_price, Decimal('1299.50'))


class ShipmentStatusHistoryModelTests(ShipmentFixtureMixin, TestCase):
    """Tests del modelo ShipmentStatusHistory."""

    def setUp(self):
        super().setUp()
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 50 #20-15, Barranquilla',
        )
        self.history_user = User.objects.create_user(
            username='admin.logistica',
            password='SecurePass123!',
            first_name='Andrés',
            last_name='Morales',
        )

    # -------------------------
    # Happy path
    # -------------------------

    def test_create_history_success(self):
        """Creación de ShipmentStatusHistory con todos los campos."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.PENDING,
            changed_by=self.history_user,
            notes='Envío registrado en el sistema.',
        )
        self.assertIsNotNone(history.pk)
        self.assertEqual(history.status, 'PENDING')

    def test_create_history_without_changed_by(self):
        """changed_by es opcional (null, blank) — debe crearse sin él."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.IN_TRANSIT,
        )
        self.assertIsNone(history.changed_by)

    def test_str_returns_shipment_id_and_status(self):
        """__str__ retorna 'Shipment #id → STATUS'."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.DELIVERED,
        )
        expected = f'Shipment #{self.shipment.pk} → DELIVERED'
        self.assertEqual(str(history), expected)

    def test_changed_at_is_auto_populated(self):
        """changed_at se establece automáticamente al crear."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.PENDING,
        )
        self.assertIsNotNone(history.changed_at)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_create_history_without_shipment_raises_integrity_error(self):
        """Omitir shipment → IntegrityError."""
        with self.assertRaises(IntegrityError):
            ShipmentStatusHistory.objects.create(
                status=ShipmentStatus.PENDING,
            )

    def test_create_history_without_status_raises_integrity_error(self):
        """Omitir status → IntegrityError (campo NOT NULL en BD)."""
        with self.assertRaises(IntegrityError):
            ShipmentStatusHistory.objects.create(
                shipment=self.shipment,
                status=None,
            )

    # -------------------------
    # Edge cases
    # -------------------------

    def test_cascade_delete_when_shipment_deleted(self):
        """Eliminar shipment → history eliminado en cascada."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.ASSIGNED,
            changed_by=self.history_user,
        )
        history_id = history.pk
        self.shipment.delete()
        self.assertFalse(ShipmentStatusHistory.objects.filter(pk=history_id).exists())

    def test_set_null_when_changed_by_user_deleted(self):
        """Eliminar changed_by user → history.changed_by queda null."""
        history = ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.IN_TRANSIT,
            changed_by=self.history_user,
        )
        self.history_user.delete()
        history.refresh_from_db()
        self.assertIsNone(history.changed_by)

    def test_multiple_history_entries_for_same_shipment(self):
        """Un shipment puede tener múltiples entradas de historial."""
        ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.PENDING,
        )
        ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.ASSIGNED,
            changed_by=self.history_user,
        )
        ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.IN_TRANSIT,
        )
        count = ShipmentStatusHistory.objects.filter(shipment=self.shipment).count()
        self.assertEqual(count, 3)
