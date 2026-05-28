"""
Tests de endpoints HTTP para el módulo shipments.
Cubre: ShipmentViewSet — CRUD, auth JWT, paginación, validaciones, status history.
"""
import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer
from apps.drivers.models import Driver
from apps.products.models import Product
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentItem, ShipmentStatus, ShipmentStatusHistory
from apps.suppliers.models import Supplier
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


SHIPMENTS_LIST_URL = '/api/v1/shipments/'


def shipment_detail_url(pk):
    return f'/api/v1/shipments/{pk}/'


class ShipmentViewSetFixtureMixin:
    """
    Crea fixtures completos para tests de views de Shipment.
    auth_user: usuario JWT (nunca asignado como driver o customer.user).
    driver_user: usuario asignado como FK de driver.
    """

    def setUp(self):
        # ---- Auth JWT ----
        self.auth_user = User.objects.create_user(
            username='api.logistica',
            password='SecurePass123!',
            first_name='API',
            last_name='Tester',
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        # ---- Supplier ----
        self.supplier = Supplier.objects.create(
            name='Distribuidora TechZone S.A.S.',
            email='ventas@techzone.com.co',
            phone='+57 601 400 5566',
            address='Calle 26 #69-76, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='900.777.888-9',
            contact_name='Felipe Arias',
        )

        # ---- Warehouse ----
        self.warehouse = Warehouse.objects.create(
            name='Bodega Aeropuerto El Dorado',
            address='Zona Franca Bogotá, Calle 106 #20-30',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 999 0011',
            capacity_m3=Decimal('5000.00'),
        )

        # ---- Product ----
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Tablet Samsung Galaxy Tab A9',
            sku='SKU-SAM-TAB-A9-001',
            category='tablets',
            unit_price=Decimal('899.99'),
            weight_kg=Decimal('0.480'),
            stock_quantity=50,
        )

        # ---- Customer ----
        self.customer = Customer.objects.create(
            name='Ofiplaza Empresarial Medellín',
            customer_type=Customer.CustomerType.COMPANY,
            email='logistica@ofiplaza.com.co',
            phone='+57 604 500 6677',
            address='Calle 7 #43-107, Medellín',
            city='Medellín',
            country='Colombia',
            tax_id='900.888.999-0',
        )

        # ---- Transport ----
        self.transport = Transport.objects.create(
            name='Camión Kenworth T680 Bogotá',
            license_plate='BOG-789',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg=Decimal('15000.00'),
            capacity_m3=Decimal('60.00'),
        )

        # ---- Driver ----
        self.driver_user = User.objects.create_user(
            username='pablo.vargas',
            password='SecurePass123!',
            first_name='Pablo',
            last_name='Vargas',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            transport=self.transport,
            license_number='COL-C1-40506070',
            phone='+57 321 400 5060',
        )

        # ---- Route ----
        self.route = Route.objects.create(
            name='Bogotá - Medellín Vía Autopista',
            origin_warehouse=self.warehouse,
            description='Autopista Medellín con punto de control en Honda.',
            estimated_duration_hours=Decimal('8.00'),
        )

        # ---- Existing Shipment ----
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            driver=self.driver,
            transport=self.transport,
            route=self.route,
            destination_address='Calle 7 #43-107, Medellín, Antioquia',
            destination_city='Medellín',
            destination_country='Colombia',
            status=ShipmentStatus.ASSIGNED,
            scheduled_date=datetime.date(2026, 7, 10),
            shipping_cost=Decimal('220000.00'),
            total_weight_kg=Decimal('2.400'),
            notes='Envío corporativo — fragile.',
        )

        # ---- Datos base para creación ----
        self.create_data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Carrera 48 #26-85, Medellín, Antioquia',
            'destination_city': 'Medellín',
            'destination_country': 'Colombia',
        }


# =============================================================================
# Tests de LIST
# =============================================================================

class ShipmentListTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_list_returns_200(self):
        response = self.client.get(SHIPMENTS_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)

    def test_list_contains_created_shipment(self):
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        ids = [s['id'] for s in data['results']]
        self.assertIn(self.shipment.pk, ids)

    def test_list_uses_list_serializer_fields(self):
        """List retorna campos reducidos — sin 'items' ni 'status_history'."""
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        self.assertGreater(len(data['results']), 0)
        item = data['results'][0]
        expected_fields = {
            'id', 'customer', 'status', 'scheduled_date',
            'destination_city', 'destination_country',
            'shipping_cost', 'created_at',
        }
        self.assertEqual(set(item.keys()), expected_fields)

    def test_list_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(SHIPMENTS_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(SHIPMENTS_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_shows_all_shipments_regardless_of_is_active(self):
        """ShipmentViewSet usa .all() — Shipment no tiene is_active, trae todos."""
        # Crear un segundo shipment
        second = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Avenida El Dorado #69-76, Bogotá',
        )
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        self.assertEqual(data['count'], 2)


# =============================================================================
# Tests de RETRIEVE
# =============================================================================

class ShipmentRetrieveTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_retrieve_returns_200(self):
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_shipment(self):
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        data = response.json()
        self.assertEqual(data['id'], self.shipment.pk)
        self.assertEqual(data['destination_city'], 'Medellín')

    def test_retrieve_uses_detail_serializer(self):
        """Detail serializer incluye items, status_history, origin_warehouse, etc."""
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        data = response.json()
        self.assertIn('items', data)
        self.assertIn('status_history', data)
        self.assertIn('origin_warehouse', data)
        self.assertIn('driver', data)
        self.assertIn('transport', data)
        self.assertIn('route', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_retrieve_detail_has_more_fields_than_list(self):
        list_response = self.client.get(SHIPMENTS_LIST_URL)
        detail_response = self.client.get(shipment_detail_url(self.shipment.pk))
        list_fields = set(list_response.json()['results'][0].keys())
        detail_fields = set(detail_response.json().keys())
        self.assertGreater(len(detail_fields), len(list_fields))

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(shipment_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_customer_is_nested_object(self):
        """El campo customer en detail es un objeto con id y name."""
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        customer_data = response.json()['customer']
        self.assertIsInstance(customer_data, dict)
        self.assertIn('id', customer_data)
        self.assertIn('name', customer_data)

    def test_retrieve_origin_warehouse_has_city_field(self):
        """WarehouseMinimalWithCitySerializer incluye 'city'."""
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        warehouse_data = response.json()['origin_warehouse']
        self.assertIn('city', warehouse_data)


# =============================================================================
# Tests de CREATE
# =============================================================================

class ShipmentCreateTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_create_shipment_returns_201(self):
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_shipment_persisted_in_database(self):
        count_before = Shipment.objects.count()
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Shipment.objects.count(), count_before + 1)

    def test_create_shipment_default_status_is_pending(self):
        """Sin especificar status, el valor por defecto es PENDING."""
        count_before = Shipment.objects.count()
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # El nuevo shipment es el más reciente (ordering = ['-created_at'])
        new_shipment = Shipment.objects.order_by('-created_at').first()
        self.assertEqual(new_shipment.status, ShipmentStatus.PENDING)

    def test_create_shipment_creates_status_history_entry(self):
        """Crear shipment → automáticamente genera 1 entrada de historial."""
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_shipment = Shipment.objects.order_by('-created_at').first()
        history_count = ShipmentStatusHistory.objects.filter(shipment=new_shipment).count()
        self.assertEqual(history_count, 1)

    def test_create_shipment_with_items_returns_201(self):
        data = {
            **self.create_data,
            'items': [
                {
                    'product': self.product.pk,
                    'quantity': 3,
                    'unit_price': '899.99',
                },
            ],
        }
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_shipment_with_items_persists_items(self):
        data = {
            **self.create_data,
            'items': [
                {'product': self.product.pk, 'quantity': 5},
            ],
        }
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_shipment = Shipment.objects.order_by('-created_at').first()
        self.assertEqual(ShipmentItem.objects.filter(shipment=new_shipment).count(), 1)

    def test_create_with_all_optional_fields_returns_201(self):
        data = {
            **self.create_data,
            'driver': self.driver.pk,
            'transport': self.transport.pk,
            'route': self.route.pk,
            'status': ShipmentStatus.ASSIGNED,
            'scheduled_date': '2026-08-01',
            'shipping_cost': '195000.00',
            'total_weight_kg': '2.880',
            'notes': 'Entregar entre 8am y 5pm.',
        }
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_customer_returns_400(self):
        data = {**self.create_data}
        del data['customer']
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer', response.json()['error'])

    def test_create_missing_origin_warehouse_returns_400(self):
        data = {**self.create_data}
        del data['origin_warehouse']
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.json()['error'])

    def test_create_missing_destination_address_returns_400(self):
        data = {**self.create_data}
        del data['destination_address']
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('destination_address', response.json()['error'])

    def test_create_blank_destination_address_returns_400(self):
        """destination_address vacío → 400."""
        data = {**self.create_data, 'destination_address': ''}
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('destination_address', response.json()['error'])

    def test_create_nonexistent_customer_returns_400(self):
        data = {**self.create_data, 'customer': 99999}
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer', response.json()['error'])

    def test_create_nonexistent_origin_warehouse_returns_400(self):
        data = {**self.create_data, 'origin_warehouse': 99999}
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.json()['error'])

    def test_create_invalid_status_returns_400(self):
        data = {**self.create_data, 'status': 'EN_RUTA'}
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.json()['error'])

    def test_create_nonexistent_driver_returns_400(self):
        data = {**self.create_data, 'driver': 99999}
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('driver', response.json()['error'])

    def test_create_item_with_nonexistent_product_returns_400(self):
        data = {
            **self.create_data,
            'items': [{'product': 99999, 'quantity': 1}],
        }
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_with_zero_quantity_returns_400(self):
        data = {
            **self.create_data,
            'items': [{'product': self.product.pk, 'quantity': 0}],
        }
        response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Tests de UPDATE (PATCH / PUT)
# =============================================================================

class ShipmentUpdateTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_patch_notes_returns_200(self):
        data = {'notes': 'Requiere embalaje especial para equipos frágiles.'}
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_value_in_database(self):
        data = {'destination_city': 'Barranquilla'}
        self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.destination_city, 'Barranquilla')

    def test_patch_status_change_returns_200(self):
        data = {'status': ShipmentStatus.IN_TRANSIT}
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_status_change_creates_history_entry(self):
        """PATCH con nuevo status → nueva entrada en ShipmentStatusHistory."""
        initial_count = ShipmentStatusHistory.objects.filter(
            shipment=self.shipment
        ).count()
        data = {'status': ShipmentStatus.IN_TRANSIT}
        self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        new_count = ShipmentStatusHistory.objects.filter(
            shipment=self.shipment
        ).count()
        self.assertEqual(new_count, initial_count + 1)

    def test_patch_same_status_does_not_create_history_entry(self):
        """PATCH con el mismo status → no se crea entrada nueva en historial."""
        # shipment.status = ASSIGNED
        initial_count = ShipmentStatusHistory.objects.filter(
            shipment=self.shipment
        ).count()
        data = {'status': ShipmentStatus.ASSIGNED}
        self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        new_count = ShipmentStatusHistory.objects.filter(
            shipment=self.shipment
        ).count()
        self.assertEqual(new_count, initial_count)

    def test_patch_with_items_replaces_items(self):
        """PATCH con 'items' → items existentes reemplazados."""
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        data = {
            'items': [
                {'product': self.product.pk, 'quantity': 7, 'unit_price': '899.99'},
            ]
        }
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = ShipmentItem.objects.filter(shipment=self.shipment)
        self.assertEqual(items.count(), 1)
        self.assertEqual(items.first().quantity, 7)

    def test_patch_nonexistent_returns_404(self):
        data = {'notes': 'No debería encontrarse.'}
        response = self.client.patch(
            shipment_detail_url(99999), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_without_auth_returns_401(self):
        self.client.credentials()
        data = {'notes': 'Sin autenticación.'}
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_invalid_status_returns_400(self):
        data = {'status': 'NO_VALIDO'}
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.json()['error'])

    def test_full_update_returns_200(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Calle 85 #20-30, Barranquilla, Atlántico',
            'destination_city': 'Barranquilla',
            'destination_country': 'Colombia',
            'status': ShipmentStatus.PENDING,
        }
        response = self.client.put(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_nonexistent_returns_404(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Cra 50 #30-40, Cali',
        }
        response = self.client.put(
            shipment_detail_url(99999), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# =============================================================================
# Tests de DELETE
# =============================================================================

class ShipmentDeleteTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_delete_returns_204(self):
        response = self.client.delete(shipment_detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        shipment_pk = self.shipment.pk
        self.client.delete(shipment_detail_url(shipment_pk))
        self.assertFalse(Shipment.objects.filter(pk=shipment_pk).exists())

    def test_delete_cascades_to_items(self):
        """Eliminar shipment → sus items eliminados en cascada."""
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
        )
        item_count_before = ShipmentItem.objects.filter(shipment=self.shipment).count()
        self.assertEqual(item_count_before, 1)

        self.client.delete(shipment_detail_url(self.shipment.pk))
        self.assertEqual(ShipmentItem.objects.filter(shipment=self.shipment).count(), 0)

    def test_delete_cascades_to_status_history(self):
        """Eliminar shipment → su historial de estado eliminado en cascada."""
        ShipmentStatusHistory.objects.create(
            shipment=self.shipment,
            status=ShipmentStatus.PENDING,
        )
        shipment_pk = self.shipment.pk
        self.client.delete(shipment_detail_url(shipment_pk))
        self.assertEqual(
            ShipmentStatusHistory.objects.filter(shipment_id=shipment_pk).count(), 0
        )

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(shipment_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.delete(shipment_detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# =============================================================================
# Tests de edge cases adicionales
# =============================================================================

class ShipmentEdgeCaseTests(ShipmentViewSetFixtureMixin, APITestCase):

    def test_retrieve_includes_status_history_after_status_change(self):
        """Después de cambiar status via PATCH, detail incluye el historial."""
        # Cambiar status para generar entrada en historial
        self.client.patch(
            shipment_detail_url(self.shipment.pk),
            {'status': ShipmentStatus.IN_TRANSIT},
            format='json',
        )
        response = self.client.get(shipment_detail_url(self.shipment.pk))
        data = response.json()
        self.assertGreater(len(data['status_history']), 0)
        statuses = [h['status'] for h in data['status_history']]
        self.assertIn('IN_TRANSIT', statuses)

    def test_retrieve_includes_items_after_create_with_items(self):
        """Detail de shipment con items refleja los items creados."""
        data = {
            **self.create_data,
            'items': [
                {'product': self.product.pk, 'quantity': 4, 'unit_price': '899.99'},
            ],
        }
        create_response = self.client.post(SHIPMENTS_LIST_URL, data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        new_shipment = Shipment.objects.order_by('-created_at').first()

        response = self.client.get(shipment_detail_url(new_shipment.pk))
        items = response.json()['items']
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['quantity'], 4)

    def test_list_customer_nested_object_has_correct_structure(self):
        """El objeto customer en list tiene 'id' y 'name' (CustomerMinimalSerializer)."""
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        customer_data = data['results'][0]['customer']
        self.assertIn('id', customer_data)
        self.assertIn('name', customer_data)
        self.assertEqual(len(customer_data.keys()), 2)

    def test_patch_assign_driver_and_transport(self):
        """PATCH asignando driver y transport → 200 y valores actualizados."""
        # Crear nuevo shipment sin driver/transport
        shipment_no_driver = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 1 #1-1, Bogotá',
        )
        data = {
            'driver': self.driver.pk,
            'transport': self.transport.pk,
            'status': ShipmentStatus.ASSIGNED,
        }
        response = self.client.patch(
            shipment_detail_url(shipment_no_driver.pk), data, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        shipment_no_driver.refresh_from_db()
        self.assertEqual(shipment_no_driver.driver, self.driver)
        self.assertEqual(shipment_no_driver.transport, self.transport)

    def test_status_history_entry_records_correct_status(self):
        """La entrada de historial creada en PATCH refleja el nuevo status."""
        data = {'status': ShipmentStatus.DELIVERED}
        self.client.patch(
            shipment_detail_url(self.shipment.pk), data, format='json'
        )
        history = ShipmentStatusHistory.objects.filter(
            shipment=self.shipment,
            status=ShipmentStatus.DELIVERED,
        )
        self.assertTrue(history.exists())

    def test_multiple_shipments_appear_in_list(self):
        """Múltiples shipments aparecen todos en la lista paginada."""
        Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 100 #50-30, Bogotá',
        )
        Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Avenida 68 #20-10, Bogotá',
        )
        response = self.client.get(SHIPMENTS_LIST_URL)
        data = response.json()
        # 1 del setUp + 2 nuevos = 3
        self.assertEqual(data['count'], 3)

    def test_patch_without_items_field_preserves_existing_items(self):
        """PATCH sin campo 'items' → items existentes se conservan."""
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=6,
        )
        response = self.client.patch(
            shipment_detail_url(self.shipment.pk),
            {'notes': 'Actualización sin tocar items.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            ShipmentItem.objects.filter(shipment=self.shipment).count(), 1
        )

    def test_create_response_uses_write_serializer_format(self):
        """La respuesta de CREATE usa WriteSerializer — contiene customer como FK."""
        response = self.client.post(SHIPMENTS_LIST_URL, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        # WriteSerializer retorna FKs como IDs
        self.assertIn('customer', data)
        self.assertIn('origin_warehouse', data)
        self.assertIn('destination_address', data)

    def test_null_driver_in_retrieve_when_not_assigned(self):
        """Si el shipment no tiene driver asignado, el campo driver es null en detail."""
        shipment_no_driver = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Cra 50 #20-30, Cali',
        )
        response = self.client.get(shipment_detail_url(shipment_no_driver.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.json()['driver'])
