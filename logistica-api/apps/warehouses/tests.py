"""
Unit tests for the warehouses module.
Covers: models, serializers, and views (API endpoints).
"""

from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.warehouses.models import Warehouse
from apps.warehouses.serializers import (
    WarehouseDetailSerializer,
    WarehouseListSerializer,
    WarehouseWriteSerializer,
)


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------


class WarehouseModelTests(TestCase):
    """Tests for the Warehouse model: constraints, __str__, field behavior."""

    def setUp(self):
        self.warehouse_data = {
            'name': 'Centro de Distribución Bogotá Norte',
            'address': 'Carrera 7 #127-45, Bogotá',
            'city': 'Bogotá',
            'country': 'Colombia',
            'phone': '+57 601 555 2100',
            'capacity_m3': Decimal('2500.00'),
            'is_active': True,
        }

    # --- Happy path ---

    def test_create_warehouse_success(self):
        """A warehouse with all fields is created and persisted correctly."""
        warehouse = Warehouse.objects.create(**self.warehouse_data)
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, 'Centro de Distribución Bogotá Norte')
        self.assertEqual(warehouse.city, 'Bogotá')
        self.assertEqual(warehouse.country, 'Colombia')
        self.assertEqual(warehouse.capacity_m3, Decimal('2500.00'))
        self.assertTrue(warehouse.is_active)

    def test_str_returns_name(self):
        """__str__ returns the warehouse name."""
        warehouse = Warehouse.objects.create(**self.warehouse_data)
        self.assertEqual(str(warehouse), 'Centro de Distribución Bogotá Norte')

    def test_is_active_defaults_to_true(self):
        """When is_active is not provided, it defaults to True."""
        warehouse = Warehouse.objects.create(name='Almacén Medellín Sur')
        self.assertTrue(warehouse.is_active)

    def test_created_at_and_updated_at_are_set(self):
        """BaseModel timestamps are auto-populated on creation."""
        warehouse = Warehouse.objects.create(**self.warehouse_data)
        self.assertIsNotNone(warehouse.created_at)
        self.assertIsNotNone(warehouse.updated_at)

    def test_create_warehouse_with_only_name(self):
        """Warehouse can be created with only the required field: name."""
        warehouse = Warehouse.objects.create(name='Almacén Cali Centro')
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, 'Almacén Cali Centro')

    # --- Unhappy path ---

    def test_create_without_name_raises_integrity_error(self):
        """Saving a Warehouse with null name raises IntegrityError at DB level."""
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(name=None)

    # --- Edge cases ---

    def test_capacity_m3_nullable(self):
        """capacity_m3 accepts null (the field is optional)."""
        warehouse = Warehouse.objects.create(
            name='Almacén Barranquilla Puerto',
            capacity_m3=None,
        )
        self.assertIsNone(warehouse.capacity_m3)

    def test_optional_text_fields_default_to_blank(self):
        """address, city, country, phone default to empty string."""
        warehouse = Warehouse.objects.create(name='Almacén Cartagena Histórico')
        self.assertEqual(warehouse.address, '')
        self.assertEqual(warehouse.city, '')
        self.assertEqual(warehouse.country, '')
        self.assertEqual(warehouse.phone, '')

    def test_inactive_warehouse_can_be_created(self):
        """A warehouse with is_active=False can be created and retrieved."""
        warehouse = Warehouse.objects.create(
            name='Almacén Pereira Clausurado',
            is_active=False,
        )
        fetched = Warehouse.objects.get(pk=warehouse.pk)
        self.assertFalse(fetched.is_active)

    def test_capacity_m3_precision(self):
        """DecimalField(8,2) stores the exact value with 2 decimal places."""
        warehouse = Warehouse.objects.create(
            name='Almacén Bucaramanga Industrial',
            capacity_m3=Decimal('99999.99'),
        )
        fetched = Warehouse.objects.get(pk=warehouse.pk)
        self.assertEqual(fetched.capacity_m3, Decimal('99999.99'))

    def test_choices_invalid_capacity_zero_fails_full_clean(self):
        """capacity_m3 = 0 is accepted at model level but the serializer rejects it.
        Here we confirm full_clean() does NOT raise (model has no min-value constraint),
        while the serializer test covers the business rule."""
        warehouse = Warehouse(
            name='Almacén Manizales Piloto',
            capacity_m3=Decimal('0.00'),
        )
        # Model itself has no min-value validator — no error expected here
        try:
            warehouse.full_clean()
        except ValidationError:
            self.fail('Model full_clean raised ValidationError for capacity_m3=0 unexpectedly')


# ---------------------------------------------------------------------------
# Serializer tests
# ---------------------------------------------------------------------------


class WarehouseWriteSerializerTests(TestCase):
    """Tests for WarehouseWriteSerializer validations."""

    def _valid_data(self, **overrides):
        data = {
            'name': 'Almacén Cúcuta Zona Franca',
            'address': 'Km 7 Vía Cúcuta-Pamplona',
            'city': 'Cúcuta',
            'country': 'Colombia',
            'phone': '+57 607 555 4400',
            'capacity_m3': '850.50',
            'is_active': True,
        }
        data.update(overrides)
        return data

    # --- Happy path ---

    def test_valid_data_is_valid(self):
        """Complete valid payload passes serializer validation."""
        serializer = WarehouseWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_object(self):
        """A valid serializer saves and creates a Warehouse in the DB."""
        serializer = WarehouseWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid())
        warehouse = serializer.save()
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, 'Almacén Cúcuta Zona Franca')

    def test_only_name_required(self):
        """Submitting only the name field (all others optional) is valid."""
        serializer = WarehouseWriteSerializer(data={'name': 'Almacén Solo Nombre'})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_capacity_m3_zero_invalid(self):
        """capacity_m3 = 0 fails the custom validator."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(capacity_m3='0.00'))
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_m3', serializer.errors)

    def test_capacity_m3_negative_invalid(self):
        """Negative capacity_m3 fails the custom validator."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(capacity_m3='-10.00'))
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_m3', serializer.errors)

    def test_capacity_m3_null_is_valid(self):
        """capacity_m3=null is accepted because the field is optional."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(capacity_m3=None))
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # --- Unhappy path ---

    def test_missing_name_is_invalid(self):
        """Omitting the required 'name' field makes the serializer invalid."""
        data = self._valid_data()
        del data['name']
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_blank_name_is_invalid(self):
        """An empty string for the required 'name' field makes the serializer invalid."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(name=''))
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_capacity_m3_custom_error_message(self):
        """The custom validator provides the expected error message in Spanish."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(capacity_m3='0'))
        serializer.is_valid()
        error_message = str(serializer.errors['capacity_m3'][0])
        self.assertIn('mayor a 0', error_message)

    # --- Edge cases ---

    def test_partial_update_only_name(self):
        """Partial update with only name field is valid."""
        warehouse = Warehouse.objects.create(
            name='Almacén Leticia Original',
            city='Leticia',
        )
        serializer = WarehouseWriteSerializer(
            instance=warehouse,
            data={'name': 'Almacén Leticia Renovado'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.name, 'Almacén Leticia Renovado')
        self.assertEqual(updated.city, 'Leticia')  # unchanged

    def test_read_only_fields_not_in_write_serializer(self):
        """id, created_at, updated_at are not writable via WarehouseWriteSerializer."""
        import datetime
        data = self._valid_data()
        data['id'] = 9999
        data['created_at'] = '2020-01-01T00:00:00Z'
        data['updated_at'] = '2020-01-01T00:00:00Z'
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        warehouse = serializer.save()
        # The injected id must be ignored — Django assigns its own pk
        self.assertNotEqual(warehouse.pk, 9999)

    def test_very_small_positive_capacity_is_valid(self):
        """capacity_m3 = 0.01 (the minimum positive value) is valid."""
        serializer = WarehouseWriteSerializer(data=self._valid_data(capacity_m3='0.01'))
        self.assertTrue(serializer.is_valid(), serializer.errors)


class WarehouseListSerializerTests(TestCase):
    """Tests for WarehouseListSerializer field exposure."""

    def test_list_serializer_exposes_expected_fields(self):
        """WarehouseListSerializer only exposes: id, name, city, country, is_active."""
        warehouse = Warehouse.objects.create(
            name='Almacén Popayán Centro',
            city='Popayán',
            country='Colombia',
            address='Carrera 9 #5-12, Popayán',
            phone='+57 602 555 8800',
            capacity_m3=Decimal('400.00'),
        )
        serializer = WarehouseListSerializer(instance=warehouse)
        data = serializer.data
        self.assertSetEqual(
            set(data.keys()),
            {'id', 'name', 'city', 'country', 'is_active'},
        )

    def test_list_serializer_does_not_expose_address_or_capacity(self):
        """address, phone, capacity_m3, created_at, updated_at are NOT in list view."""
        warehouse = Warehouse.objects.create(name='Almacén Ibagué Norte')
        serializer = WarehouseListSerializer(instance=warehouse)
        data = serializer.data
        self.assertNotIn('address', data)
        self.assertNotIn('phone', data)
        self.assertNotIn('capacity_m3', data)
        self.assertNotIn('created_at', data)
        self.assertNotIn('updated_at', data)


class WarehouseDetailSerializerTests(TestCase):
    """Tests for WarehouseDetailSerializer field exposure."""

    def test_detail_serializer_exposes_all_fields(self):
        """WarehouseDetailSerializer exposes all fields including timestamps."""
        warehouse = Warehouse.objects.create(
            name='Almacén Santa Marta Puerto',
            address='Calle 22 #3-45, Santa Marta',
            city='Santa Marta',
            country='Colombia',
            phone='+57 605 555 3300',
            capacity_m3=Decimal('1200.75'),
        )
        serializer = WarehouseDetailSerializer(instance=warehouse)
        data = serializer.data
        expected_fields = {
            'id', 'name', 'address', 'city', 'country', 'phone',
            'capacity_m3', 'is_active', 'created_at', 'updated_at',
        }
        self.assertSetEqual(set(data.keys()), expected_fields)


# ---------------------------------------------------------------------------
# View / endpoint tests
# ---------------------------------------------------------------------------


class WarehouseViewSetTests(APITestCase):
    """Integration tests for the /api/v1/warehouses/ endpoints."""

    LIST_URL = '/api/v1/warehouses/'

    def _detail_url(self, pk):
        return f'/api/v1/warehouses/{pk}/'

    def setUp(self):
        self.user = User.objects.create_user(
            username='tester_warehouses',
            password='SecurePass123!',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacén Medellín El Poblado',
            address='Calle 10 #43E-31, Medellín',
            city='Medellín',
            country='Colombia',
            phone='+57 604 555 7700',
            capacity_m3=Decimal('3200.00'),
            is_active=True,
        )

    # --- Happy path: GET list ---

    def test_list_returns_200(self):
        """GET /api/v1/warehouses/ with valid JWT returns 200."""
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        """GET list response contains count, next, previous, results keys."""
        response = self.client.get(self.LIST_URL)
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)

    def test_list_contains_active_warehouse(self):
        """Active warehouses appear in the list response."""
        response = self.client.get(self.LIST_URL)
        ids = [w['id'] for w in response.json()['results']]
        self.assertIn(self.warehouse.pk, ids)

    def test_list_uses_list_serializer_fields(self):
        """List response items only contain id, name, city, country, is_active."""
        response = self.client.get(self.LIST_URL)
        result = response.json()['results'][0]
        self.assertSetEqual(
            set(result.keys()),
            {'id', 'name', 'city', 'country', 'is_active'},
        )

    # --- Happy path: POST create ---

    def test_create_returns_201(self):
        """POST /api/v1/warehouses/ with valid data returns 201."""
        payload = {
            'name': 'Almacén Villavicencio Centro',
            'address': 'Carrera 30 #12-50, Villavicencio',
            'city': 'Villavicencio',
            'country': 'Colombia',
            'phone': '+57 608 555 6600',
            'capacity_m3': '750.50',
            'is_active': True,
        }
        response = self.client.post(self.LIST_URL, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Warehouse.objects.filter(name='Almacén Villavicencio Centro').exists())

    def test_create_with_only_name_returns_201(self):
        """POST with only the required field (name) returns 201."""
        response = self.client.post(
            self.LIST_URL,
            data={'name': 'Almacén Neiva Zona Industrial'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Happy path: GET retrieve ---

    def test_retrieve_returns_200(self):
        """GET /api/v1/warehouses/{id}/ with valid id returns 200."""
        response = self.client.get(self._detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_uses_detail_serializer_fields(self):
        """Retrieve response includes all detail fields including timestamps."""
        response = self.client.get(self._detail_url(self.warehouse.pk))
        data = response.json()
        expected_fields = {
            'id', 'name', 'address', 'city', 'country', 'phone',
            'capacity_m3', 'is_active', 'created_at', 'updated_at',
        }
        self.assertSetEqual(set(data.keys()), expected_fields)

    def test_list_vs_retrieve_field_difference(self):
        """List serializer has fewer fields than detail serializer."""
        list_response = self.client.get(self.LIST_URL)
        list_fields = set(list_response.json()['results'][0].keys())

        detail_response = self.client.get(self._detail_url(self.warehouse.pk))
        detail_fields = set(detail_response.json().keys())

        self.assertLess(len(list_fields), len(detail_fields))
        # Detail has address, phone, capacity_m3, created_at, updated_at not in list
        self.assertIn('address', detail_fields)
        self.assertNotIn('address', list_fields)

    # --- Happy path: PATCH partial update ---

    def test_partial_update_returns_200(self):
        """PATCH /api/v1/warehouses/{id}/ with valid partial data returns 200."""
        response = self.client.patch(
            self._detail_url(self.warehouse.pk),
            data={'city': 'Envigado'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'Envigado')

    def test_full_update_returns_200(self):
        """PUT /api/v1/warehouses/{id}/ with complete data returns 200."""
        payload = {
            'name': 'Almacén Medellín El Poblado Actualizado',
            'address': 'Calle 10 #43E-31, Medellín',
            'city': 'Medellín',
            'country': 'Colombia',
            'phone': '+57 604 555 7700',
            'capacity_m3': '3500.00',
            'is_active': True,
        }
        response = self.client.put(
            self._detail_url(self.warehouse.pk),
            data=payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- Happy path: DELETE ---

    def test_delete_returns_204(self):
        """DELETE /api/v1/warehouses/{id}/ returns 204."""
        response = self.client.delete(self._detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Warehouse.objects.filter(pk=self.warehouse.pk).exists())

    # --- Unhappy path: authentication ---

    def test_list_without_auth_returns_401(self):
        """GET list without Authorization header returns 401."""
        self.client.credentials()
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_auth_returns_401(self):
        """POST without Authorization header returns 401."""
        self.client.credentials()
        response = self.client.post(
            self.LIST_URL,
            data={'name': 'Almacén Sin Auth'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_auth_returns_401(self):
        """GET detail without token returns 401."""
        self.client.credentials()
        response = self.client.get(self._detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        """Malformed JWT token returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Unhappy path: validation errors ---

    def test_create_missing_name_returns_400(self):
        """POST without the required 'name' field returns 400 with field error."""
        response = self.client.post(
            self.LIST_URL,
            data={'city': 'Bogotá'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error = response.json().get('error', {})
        self.assertIn('name', error)

    def test_create_blank_name_returns_400(self):
        """POST with an empty name string returns 400."""
        response = self.client.post(
            self.LIST_URL,
            data={'name': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error = response.json().get('error', {})
        self.assertIn('name', error)

    def test_create_zero_capacity_returns_400(self):
        """POST with capacity_m3=0 returns 400 due to custom validator."""
        response = self.client.post(
            self.LIST_URL,
            data={'name': 'Almacén Armenia Tech', 'capacity_m3': '0.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error = response.json().get('error', {})
        self.assertIn('capacity_m3', error)

    def test_create_negative_capacity_returns_400(self):
        """POST with capacity_m3 < 0 returns 400."""
        response = self.client.post(
            self.LIST_URL,
            data={'name': 'Almacén Pasto Sur', 'capacity_m3': '-100.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error = response.json().get('error', {})
        self.assertIn('capacity_m3', error)

    # --- Unhappy path: 404 ---

    def test_retrieve_nonexistent_returns_404(self):
        """GET /api/v1/warehouses/99999/ returns 404."""
        response = self.client.get(self._detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        """PATCH on non-existent id returns 404."""
        response = self.client.patch(
            self._detail_url(99999),
            data={'city': 'Bogotá'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        """DELETE on non-existent id returns 404."""
        response = self.client.delete(self._detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Edge cases ---

    def test_inactive_warehouse_not_in_list(self):
        """A warehouse with is_active=False is excluded from the list endpoint."""
        inactive = Warehouse.objects.create(
            name='Almacén Tunja Antiguo',
            city='Tunja',
            is_active=False,
        )
        response = self.client.get(self.LIST_URL)
        ids = [w['id'] for w in response.json()['results']]
        self.assertNotIn(inactive.pk, ids)

    def test_inactive_warehouse_not_accessible_via_retrieve(self):
        """GET detail on an inactive warehouse returns 404 (not in queryset)."""
        inactive = Warehouse.objects.create(
            name='Almacén Montería Cerrado',
            is_active=False,
        )
        response = self.client.get(self._detail_url(inactive.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_multiple_warehouses_count_in_list(self):
        """List count reflects the number of active warehouses."""
        Warehouse.objects.create(name='Almacén Sincelejo Norte', is_active=True)
        Warehouse.objects.create(name='Almacén Riohacha Costa', is_active=True)
        Warehouse.objects.create(name='Almacén Quibdó Selva', is_active=False)

        response = self.client.get(self.LIST_URL)
        data = response.json()
        # setUp creates 1 active, we add 2 more active + 1 inactive
        self.assertEqual(data['count'], 3)

    def test_patch_deactivate_warehouse_then_not_in_list(self):
        """After PATCH sets is_active=False, the warehouse disappears from list."""
        response = self.client.patch(
            self._detail_url(self.warehouse.pk),
            data={'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        list_response = self.client.get(self.LIST_URL)
        ids = [w['id'] for w in list_response.json()['results']]
        self.assertNotIn(self.warehouse.pk, ids)

    def test_create_returns_data_in_response_body(self):
        """POST 201 response body contains the created warehouse data."""
        payload = {
            'name': 'Almacén Soledad Atlántico',
            'city': 'Soledad',
            'country': 'Colombia',
        }
        response = self.client.post(self.LIST_URL, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data.get('name'), 'Almacén Soledad Atlántico')

    def test_update_capacity_to_null_allowed(self):
        """PATCH can set capacity_m3 to null (the field is optional)."""
        response = self.client.patch(
            self._detail_url(self.warehouse.pk),
            data={'capacity_m3': None},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertIsNone(self.warehouse.capacity_m3)

    def test_error_response_structure_has_error_and_status_code(self):
        """400 error responses use the custom handler structure: {error: {...}, status_code: 400}."""
        response = self.client.post(
            self.LIST_URL,
            data={'name': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertIn('error', body)
        self.assertIn('status_code', body)
        self.assertEqual(body['status_code'], 400)
