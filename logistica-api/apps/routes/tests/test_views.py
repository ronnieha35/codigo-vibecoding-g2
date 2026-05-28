from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='tester_routes', password='SecurePass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        self.warehouse_bogota = Warehouse.objects.create(
            name='Bodega Central Bogotá',
            address='Calle 80 #45-12, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 555 1100',
            capacity_m3=Decimal('2500.00'),
        )
        self.warehouse_medellin = Warehouse.objects.create(
            name='Centro Logístico Medellín',
            address='Carrera 48 #26-85, Medellín',
            city='Medellín',
            country='Colombia',
            phone='+57 604 555 2200',
            capacity_m3=Decimal('1800.00'),
        )
        self.warehouse_manizales = Warehouse.objects.create(
            name='Almacén Manizales',
            address='Avenida Santander #65-20, Manizales',
            city='Manizales',
            country='Colombia',
            phone='+57 606 555 3300',
            capacity_m3=Decimal('900.00'),
        )

        self.route = Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_bogota,
            description='Ruta principal entre las dos ciudades más grandes.',
            estimated_duration_hours=Decimal('8.50'),
        )

        self.list_url = '/api/v1/routes/'
        self.detail_url = f'/api/v1/routes/{self.route.id}/'

        self.create_data = {
            'name': 'Cali - Barranquilla',
            'origin_warehouse': self.warehouse_medellin.id,
            'description': 'Ruta costera con escala en Cartagena.',
            'estimated_duration_hours': '14.00',
        }

    # -------------------------
    # Happy path — CRUD
    # -------------------------

    def test_list_returns_200(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        response = self.client.get(self.list_url)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_contains_active_route(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.route.id)

    def test_create_route_returns_201(self):
        response = self.client.post(self.list_url, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Route.objects.filter(name='Cali - Barranquilla').exists())

    def test_create_route_with_stops_returns_201(self):
        data = {
            **self.create_data,
            'stops': [
                {
                    'warehouse': self.warehouse_manizales.id,
                    'stop_order': 1,
                    'estimated_duration_minutes': 30,
                }
            ],
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_route = Route.objects.get(name='Cali - Barranquilla')
        self.assertEqual(new_route.stops.count(), 1)

    def test_retrieve_returns_200(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.route.id)

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            self.detail_url,
            {'name': 'Bogotá - Medellín Actualizada'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Bogotá - Medellín Actualizada')

    def test_full_update_returns_200(self):
        update_data = {
            'name': 'Bogotá - Medellín Express',
            'origin_warehouse': self.warehouse_bogota.id,
            'estimated_duration_hours': '7.00',
        }
        response = self.client.put(self.detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_returns_204(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Route.objects.filter(id=self.route.id).exists())

    # -------------------------
    # Unhappy path — authentication
    # -------------------------

    def test_list_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.list_url, self.create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------
    # Unhappy path — validation
    # -------------------------

    def test_create_missing_name_returns_400(self):
        data = {**self.create_data}
        del data['name']
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data['error'])

    def test_create_missing_origin_warehouse_returns_400(self):
        data = {**self.create_data}
        del data['origin_warehouse']
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data['error'])

    def test_create_nonexistent_origin_warehouse_returns_400(self):
        data = {**self.create_data, 'origin_warehouse': 99999}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data['error'])

    def test_create_with_nonexistent_stop_warehouse_returns_400(self):
        data = {
            **self.create_data,
            'stops': [
                {'warehouse': 99999, 'stop_order': 1}
            ],
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch(
            '/api/v1/routes/99999/',
            {'name': 'No existe'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # Edge case
    # -------------------------

    def test_inactive_route_not_in_list(self):
        inactive_route = Route.objects.create(
            name='Ruta Inactiva Bogotá - Cali',
            origin_warehouse=self.warehouse_bogota,
            is_active=False,
        )
        response = self.client.get(self.list_url)
        ids_in_response = [r['id'] for r in response.data['results']]
        self.assertNotIn(inactive_route.id, ids_in_response)

    def test_list_serializer_has_fewer_fields_than_detail(self):
        response_list = self.client.get(self.list_url)
        response_detail = self.client.get(self.detail_url)

        list_fields = set(response_list.data['results'][0].keys())
        detail_fields = set(response_detail.data.keys())

        # Detail has 'description', 'stops', 'created_at', 'updated_at' that list doesn't
        self.assertIn('stops', detail_fields)
        self.assertNotIn('stops', list_fields)
        self.assertIn('created_at', detail_fields)
        self.assertNotIn('created_at', list_fields)

    def test_retrieve_includes_stops(self):
        RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_medellin,
            stop_order=1,
            estimated_duration_minutes=30,
        )
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stops', response.data)
        self.assertEqual(len(response.data['stops']), 1)
        self.assertEqual(response.data['stops'][0]['stop_order'], 1)

    def test_update_with_stops_replaces_existing_stops(self):
        RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=1,
        )
        update_data = {
            'name': 'Bogotá - Medellín',
            'origin_warehouse': self.warehouse_bogota.id,
            'stops': [
                {
                    'warehouse': self.warehouse_medellin.id,
                    'stop_order': 1,
                    'estimated_duration_minutes': 60,
                }
            ],
        }
        response = self.client.put(self.detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.stops.count(), 1)
        self.assertEqual(self.route.stops.first().warehouse, self.warehouse_medellin)

    def test_create_duplicate_stop_order_in_stops_raises_integrity_error(self):
        # Sending two stops with the same stop_order for a new route triggers a DB
        # UniqueConstraint violation. DRF's custom_exception_handler only intercepts
        # rest_framework exceptions; IntegrityError propagates as an unhandled exception.
        # We verify this behavior by disabling raise_request_exception temporarily.
        from django.db import IntegrityError

        data = {
            **self.create_data,
            'stops': [
                {'warehouse': self.warehouse_manizales.id, 'stop_order': 1},
                {'warehouse': self.warehouse_medellin.id, 'stop_order': 1},
            ],
        }
        self.client.raise_request_exception = False
        response = self.client.post(self.list_url, data, format='json')
        self.client.raise_request_exception = True
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_partial_update_without_stops_keeps_existing_stops(self):
        RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_medellin,
            stop_order=1,
        )
        response = self.client.patch(
            self.detail_url,
            {'name': 'Bogotá - Medellín Modificada'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # stops not passed in PATCH → should remain (update() checks `if stops_data is not None`)
        self.assertEqual(self.route.stops.count(), 1)
