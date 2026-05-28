from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.transport.models import Transport
from apps.transport.serializers import (
    TransportDetailSerializer,
    TransportListSerializer,
    TransportWriteSerializer,
)

# ---------------------------------------------------------------------------
# Helper — URL base
# ---------------------------------------------------------------------------
TRANSPORT_LIST_URL = '/api/v1/transport/'


def transport_detail_url(pk):
    return f'/api/v1/transport/{pk}/'


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class TransportModelTests(TestCase):
    """Tests para el modelo Transport: constraints, __str__, choices, FKs."""

    def setUp(self):
        self.valid_data = dict(
            name='Kenworth T800 Tractocamión',
            license_plate='KNW-347',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg=Decimal('20000.00'),
            capacity_m3=Decimal('80.00'),
        )

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_create_transport_success(self):
        transport = Transport.objects.create(**self.valid_data)
        self.assertIsNotNone(transport.pk)
        self.assertEqual(transport.name, 'Kenworth T800 Tractocamión')
        self.assertEqual(transport.license_plate, 'KNW-347')
        self.assertEqual(transport.vehicle_type, Transport.VehicleType.TRUCK)
        self.assertEqual(transport.capacity_kg, Decimal('20000.00'))
        self.assertEqual(transport.capacity_m3, Decimal('80.00'))

    def test_defaults_on_create(self):
        transport = Transport.objects.create(**self.valid_data)
        self.assertTrue(transport.is_available)
        self.assertTrue(transport.is_active)

    def test_str_representation(self):
        transport = Transport.objects.create(**self.valid_data)
        expected = 'Kenworth T800 Tractocamión (KNW-347)'
        self.assertEqual(str(transport), expected)

    def test_create_transport_all_vehicle_types(self):
        for i, vehicle_type in enumerate(Transport.VehicleType.values):
            transport = Transport.objects.create(
                name=f'Vehículo tipo {vehicle_type}',
                license_plate=f'TST-{i:03d}',
                vehicle_type=vehicle_type,
            )
            self.assertEqual(transport.vehicle_type, vehicle_type)

    def test_capacity_fields_accept_null(self):
        transport = Transport.objects.create(
            name='Freightliner Cascadia',
            license_plate='FLC-892',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg=None,
            capacity_m3=None,
        )
        self.assertIsNone(transport.capacity_kg)
        self.assertIsNone(transport.capacity_m3)

    def test_created_at_and_updated_at_set_automatically(self):
        transport = Transport.objects.create(**self.valid_data)
        self.assertIsNotNone(transport.created_at)
        self.assertIsNotNone(transport.updated_at)

    # ------------------------------------------------------------------
    # Unhappy path
    # ------------------------------------------------------------------

    def test_duplicate_license_plate_raises_integrity_error(self):
        Transport.objects.create(**self.valid_data)
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name='Mercedes-Benz Actros',
                license_plate='KNW-347',  # misma placa
                vehicle_type=Transport.VehicleType.TRUCK,
            )

    def test_name_required_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name=None,
                license_plate='MBZ-101',
                vehicle_type=Transport.VehicleType.VAN,
            )

    def test_license_plate_required_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name='Freightliner FLD120',
                license_plate=None,
                vehicle_type=Transport.VehicleType.TRUCK,
            )

    # ------------------------------------------------------------------
    # Edge cases — choices
    # ------------------------------------------------------------------

    def test_invalid_vehicle_type_raises_validation_error_on_full_clean(self):
        transport = Transport(
            name='Vehículo inválido',
            license_plate='INV-999',
            vehicle_type='HELICOPTER',  # valor fuera de choices
        )
        with self.assertRaises(ValidationError):
            transport.full_clean()

    def test_truck_choice_label(self):
        self.assertEqual(Transport.VehicleType.TRUCK.label, 'Camión')

    def test_van_choice_label(self):
        self.assertEqual(Transport.VehicleType.VAN.label, 'Furgoneta')

    def test_motorcycle_choice_label(self):
        self.assertEqual(Transport.VehicleType.MOTORCYCLE.label, 'Motocicleta')

    def test_other_choice_label(self):
        self.assertEqual(Transport.VehicleType.OTHER.label, 'Otro')

    def test_is_available_can_be_false(self):
        transport = Transport.objects.create(
            name='Van Logística Exprés',
            license_plate='VLE-456',
            vehicle_type=Transport.VehicleType.VAN,
            is_available=False,
        )
        self.assertFalse(transport.is_available)

    def test_is_active_can_be_false(self):
        transport = Transport.objects.create(
            name='Moto de Reparto Urbano',
            license_plate='MRU-123',
            vehicle_type=Transport.VehicleType.MOTORCYCLE,
            is_active=False,
        )
        self.assertFalse(transport.is_active)


# ---------------------------------------------------------------------------
# Serializer tests
# ---------------------------------------------------------------------------

class TransportWriteSerializerTests(TestCase):
    """Tests para TransportWriteSerializer: validaciones, campos requeridos."""

    def setUp(self):
        self.valid_data = {
            'name': 'Kenworth T680 Streamline',
            'license_plate': 'KTH-680',
            'vehicle_type': 'TRUCK',
            'capacity_kg': '15000.00',
            'capacity_m3': '60.00',
            'is_available': True,
            'is_active': True,
        }

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_valid_data_is_valid(self):
        serializer = TransportWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_object(self):
        serializer = TransportWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        transport = serializer.save()
        self.assertIsNotNone(transport.pk)
        self.assertEqual(transport.name, 'Kenworth T680 Streamline')
        self.assertEqual(transport.license_plate, 'KTH-680')

    def test_optional_capacity_fields_omitted(self):
        data = {
            'name': 'Freightliner M2 106',
            'license_plate': 'FMD-106',
            'vehicle_type': 'VAN',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_all_vehicle_types_are_valid(self):
        for i, vtype in enumerate(['TRUCK', 'VAN', 'MOTORCYCLE', 'OTHER']):
            data = {
                'name': f'Vehículo {vtype}',
                'license_plate': f'VTY-{i:03d}',
                'vehicle_type': vtype,
            }
            serializer = TransportWriteSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f'{vtype}: {serializer.errors}')

    # ------------------------------------------------------------------
    # Unhappy path
    # ------------------------------------------------------------------

    def test_missing_name_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'name'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_license_plate_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'license_plate'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_plate', serializer.errors)

    def test_missing_vehicle_type_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'vehicle_type'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_invalid_vehicle_type_is_invalid(self):
        data = {**self.valid_data, 'vehicle_type': 'SUBMARINE'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_duplicate_license_plate_is_invalid(self):
        # Crear primero en BD
        Transport.objects.create(
            name='Kenworth T800',
            license_plate='KTH-680',
            vehicle_type='TRUCK',
        )
        serializer = TransportWriteSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_plate', serializer.errors)

    def test_capacity_kg_zero_is_invalid(self):
        data = {**self.valid_data, 'capacity_kg': '0'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)

    def test_capacity_kg_negative_is_invalid(self):
        data = {**self.valid_data, 'capacity_kg': '-500'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)

    def test_capacity_m3_zero_is_invalid(self):
        data = {**self.valid_data, 'capacity_m3': '0'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_m3', serializer.errors)

    def test_capacity_m3_negative_is_invalid(self):
        data = {**self.valid_data, 'capacity_m3': '-10'}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_m3', serializer.errors)

    # ------------------------------------------------------------------
    # Edge cases
    # ------------------------------------------------------------------

    def test_blank_name_is_invalid(self):
        data = {**self.valid_data, 'name': ''}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_blank_license_plate_is_invalid(self):
        data = {**self.valid_data, 'license_plate': ''}
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_plate', serializer.errors)

    def test_capacity_kg_null_allowed(self):
        data = {**self.valid_data, 'capacity_kg': None}
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_capacity_m3_null_allowed(self):
        data = {**self.valid_data, 'capacity_m3': None}
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_capacity_kg_positive_non_integer_is_valid(self):
        data = {**self.valid_data, 'capacity_kg': '750.50', 'license_plate': 'DEC-001'}
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class TransportListSerializerTests(TestCase):
    """Tests para TransportListSerializer: campos expuestos."""

    def setUp(self):
        self.transport = Transport.objects.create(
            name='Mercedes-Benz Actros 2545',
            license_plate='MBA-545',
            vehicle_type='TRUCK',
            capacity_kg=Decimal('25000.00'),
            capacity_m3=Decimal('90.00'),
        )

    def test_list_serializer_expected_fields(self):
        serializer = TransportListSerializer(self.transport)
        data = serializer.data
        expected_fields = {'id', 'name', 'license_plate', 'vehicle_type', 'is_available', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_list_serializer_excludes_capacity_and_timestamps(self):
        serializer = TransportListSerializer(self.transport)
        data = serializer.data
        self.assertNotIn('capacity_kg', data)
        self.assertNotIn('capacity_m3', data)
        self.assertNotIn('created_at', data)
        self.assertNotIn('updated_at', data)


class TransportDetailSerializerTests(TestCase):
    """Tests para TransportDetailSerializer: campos completos."""

    def setUp(self):
        self.transport = Transport.objects.create(
            name='Volvo FH 540',
            license_plate='VFH-540',
            vehicle_type='TRUCK',
            capacity_kg=Decimal('22000.00'),
            capacity_m3=Decimal('82.00'),
        )

    def test_detail_serializer_expected_fields(self):
        serializer = TransportDetailSerializer(self.transport)
        data = serializer.data
        expected_fields = {
            'id', 'name', 'license_plate', 'vehicle_type',
            'capacity_kg', 'capacity_m3', 'is_available', 'is_active',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_detail_serializer_has_more_fields_than_list(self):
        list_data = TransportListSerializer(self.transport).data
        detail_data = TransportDetailSerializer(self.transport).data
        self.assertGreater(len(detail_data), len(list_data))


# ---------------------------------------------------------------------------
# View / Endpoint tests
# ---------------------------------------------------------------------------

class TransportViewSetTests(APITestCase):
    """Tests de endpoints HTTP para TransportViewSet."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='conductor_tester',
            password='SecurePass123!',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
        self.transport = Transport.objects.create(
            name='Kenworth T800 Tractocamión',
            license_plate='KNW-800',
            vehicle_type='TRUCK',
            capacity_kg=Decimal('20000.00'),
            capacity_m3=Decimal('80.00'),
        )
        self.valid_payload = {
            'name': 'Freightliner Cascadia 126',
            'license_plate': 'FLC-126',
            'vehicle_type': 'TRUCK',
            'capacity_kg': '18000.00',
            'capacity_m3': '70.00',
        }

    # ------------------------------------------------------------------
    # Happy path — CRUD autenticado
    # ------------------------------------------------------------------

    def test_list_returns_200(self):
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        response = self.client.get(TRANSPORT_LIST_URL)
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)

    def test_list_contains_active_transport(self):
        response = self.client.get(TRANSPORT_LIST_URL)
        ids = [item['id'] for item in response.json()['results']]
        self.assertIn(self.transport.pk, ids)

    def test_retrieve_returns_200(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_transport(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        data = response.json()
        self.assertEqual(data['id'], self.transport.pk)
        self.assertEqual(data['license_plate'], 'KNW-800')

    def test_create_returns_201(self):
        response = self.client.post(TRANSPORT_LIST_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_persists_object(self):
        response = self.client.post(TRANSPORT_LIST_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Transport.objects.filter(license_plate='FLC-126').exists())

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            transport_detail_url(self.transport.pk),
            {'name': 'Kenworth T800 Actualizado'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_changes_value(self):
        self.client.patch(
            transport_detail_url(self.transport.pk),
            {'name': 'Kenworth T800 Actualizado'},
            format='json',
        )
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.name, 'Kenworth T800 Actualizado')

    def test_full_update_returns_200(self):
        payload = {
            'name': 'Mercedes-Benz Actros 2551',
            'license_plate': 'KNW-800',  # misma placa
            'vehicle_type': 'TRUCK',
            'capacity_kg': '25000.00',
            'capacity_m3': '90.00',
        }
        response = self.client.put(
            transport_detail_url(self.transport.pk),
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_returns_204(self):
        response = self.client.delete(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_object(self):
        self.client.delete(transport_detail_url(self.transport.pk))
        self.assertFalse(Transport.objects.filter(pk=self.transport.pk).exists())

    # ------------------------------------------------------------------
    # Unhappy path — autenticación
    # ------------------------------------------------------------------

    def test_list_without_auth_returns_401(self):
        self.client.credentials()  # quitar token
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.post(TRANSPORT_LIST_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Unhappy path — validación de datos
    # ------------------------------------------------------------------

    def test_create_missing_name_returns_400(self):
        data = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.json()['error'])

    def test_create_missing_license_plate_returns_400(self):
        data = {k: v for k, v in self.valid_payload.items() if k != 'license_plate'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_plate', response.json()['error'])

    def test_create_missing_vehicle_type_returns_400(self):
        data = {k: v for k, v in self.valid_payload.items() if k != 'vehicle_type'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle_type', response.json()['error'])

    def test_create_invalid_vehicle_type_returns_400(self):
        data = {**self.valid_payload, 'vehicle_type': 'AVION'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle_type', response.json()['error'])

    def test_create_duplicate_license_plate_returns_400(self):
        data = {**self.valid_payload, 'license_plate': 'KNW-800'}  # ya existe
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_plate', response.json()['error'])

    def test_create_capacity_kg_zero_returns_400(self):
        data = {**self.valid_payload, 'capacity_kg': '0'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.json()['error'])

    def test_create_capacity_kg_negative_returns_400(self):
        data = {**self.valid_payload, 'capacity_kg': '-1000'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.json()['error'])

    def test_create_capacity_m3_zero_returns_400(self):
        data = {**self.valid_payload, 'capacity_m3': '0'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_m3', response.json()['error'])

    def test_create_capacity_m3_negative_returns_400(self):
        data = {**self.valid_payload, 'capacity_m3': '-5'}
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_m3', response.json()['error'])

    # ------------------------------------------------------------------
    # Unhappy path — recursos no encontrados
    # ------------------------------------------------------------------

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(transport_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch(
            transport_detail_url(99999),
            {'name': 'No existe'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(transport_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Edge cases
    # ------------------------------------------------------------------

    def test_inactive_transport_not_in_list(self):
        inactive = Transport.objects.create(
            name='Vehículo Inactivo Retirado',
            license_plate='RET-000',
            vehicle_type='VAN',
            is_active=False,
        )
        response = self.client.get(TRANSPORT_LIST_URL)
        ids = [item['id'] for item in response.json()['results']]
        self.assertNotIn(inactive.pk, ids)

    def test_list_serializer_fewer_fields_than_detail(self):
        list_response = self.client.get(TRANSPORT_LIST_URL)
        list_item = list_response.json()['results'][0]

        detail_response = self.client.get(transport_detail_url(self.transport.pk))
        detail_item = detail_response.json()

        self.assertGreater(len(detail_item), len(list_item))

    def test_list_does_not_expose_capacity_fields(self):
        response = self.client.get(TRANSPORT_LIST_URL)
        item = response.json()['results'][0]
        self.assertNotIn('capacity_kg', item)
        self.assertNotIn('capacity_m3', item)

    def test_detail_exposes_capacity_fields(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        data = response.json()
        self.assertIn('capacity_kg', data)
        self.assertIn('capacity_m3', data)

    def test_detail_exposes_timestamps(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        data = response.json()
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_create_with_null_capacity_fields_returns_201(self):
        data = {
            'name': 'Moto de Mensajería Bogotá',
            'license_plate': 'MMB-987',
            'vehicle_type': 'MOTORCYCLE',
            'capacity_kg': None,
            'capacity_m3': None,
        }
        response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_count_reflects_only_active_transports(self):
        # Crear uno inactivo — no debe contar
        Transport.objects.create(
            name='Furgón Dado de Baja',
            license_plate='DAB-001',
            vehicle_type='VAN',
            is_active=False,
        )
        response = self.client.get(TRANSPORT_LIST_URL)
        active_count = Transport.objects.filter(is_active=True).count()
        self.assertEqual(response.json()['count'], active_count)

    def test_patch_update_is_available_field(self):
        self.transport.is_available = True
        self.transport.save()
        response = self.client.patch(
            transport_detail_url(self.transport.pk),
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertFalse(self.transport.is_available)

    def test_create_motorcycle_van_other_types(self):
        for i, vtype in enumerate(['VAN', 'MOTORCYCLE', 'OTHER']):
            data = {
                'name': f'Vehículo Tipo {vtype} Colombia',
                'license_plate': f'COL-{i:03d}',
                'vehicle_type': vtype,
            }
            response = self.client.post(TRANSPORT_LIST_URL, data, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                f'{vtype} debería ser válido: {response.json()}',
            )
