from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver
from apps.transport.models import Transport


def get_auth_header(user):
    refresh = RefreshToken.for_user(user)
    return f'Bearer {refresh.access_token}'


class DriverViewSetSetupMixin:
    """
    Shared setUp for Driver view tests.
    NOTE: self.auth_user is the JWT user (never assigned as a driver FK).
          self.driver_user is the user assigned to self.driver via OneToOne.
    """

    def setUp(self):
        # JWT authentication user — separate from any driver FK
        self.auth_user = User.objects.create_user(
            username='admin.tester',
            password='SecurePass123!',
            first_name='Admin',
            last_name='Tester',
        )
        self.client.credentials(HTTP_AUTHORIZATION=get_auth_header(self.auth_user))

        # Transport fixture
        self.transport = Transport.objects.create(
            name='Camion Pesado Bogota Norte',
            license_plate='BOG-001',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg='8000.00',
            capacity_m3='40.00',
        )

        # Driver user (FK target) — different from auth_user
        self.driver_user = User.objects.create_user(
            username='juan.perez',
            password='SecurePass123!',
            first_name='Juan',
            last_name='Perez',
            email='juan.perez@transportes.co',
        )

        # Existing driver
        self.driver = Driver.objects.create(
            user=self.driver_user,
            transport=self.transport,
            license_number='COL-B2-10203040',
            phone='+57 311 100 2030',
            is_available=True,
            is_active=True,
        )


class DriverListViewTests(DriverViewSetSetupMixin, APITestCase):
    def test_list_returns_200(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        response = self.client.get('/api/v1/drivers/')
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)

    def test_list_contains_active_driver(self):
        response = self.client.get('/api/v1/drivers/')
        data = response.json()
        ids = [d['id'] for d in data['results']]
        self.assertIn(self.driver.pk, ids)

    def test_list_uses_list_serializer_fields(self):
        response = self.client.get('/api/v1/drivers/')
        data = response.json()
        self.assertGreater(len(data['results']), 0)
        item = data['results'][0]
        expected_fields = {'id', 'license_number', 'phone', 'is_available', 'is_active'}
        self.assertEqual(set(item.keys()), expected_fields)

    def test_list_inactive_driver_not_in_results(self):
        inactive_user = User.objects.create_user(
            username='inactivo.driver',
            password='SecurePass123!',
        )
        Driver.objects.create(
            user=inactive_user,
            license_number='COL-B2-INACTIVE1',
            is_active=False,
        )
        response = self.client.get('/api/v1/drivers/')
        data = response.json()
        license_numbers = [d['license_number'] for d in data['results']]
        self.assertNotIn('COL-B2-INACTIVE1', license_numbers)

    def test_list_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverRetrieveViewTests(DriverViewSetSetupMixin, APITestCase):
    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_driver(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        data = response.json()
        self.assertEqual(data['id'], self.driver.pk)
        self.assertEqual(data['license_number'], 'COL-B2-10203040')

    def test_retrieve_uses_detail_serializer(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        data = response.json()
        # Detail serializer has expanded user and transport objects
        self.assertIn('user', data)
        self.assertIsInstance(data['user'], dict)
        self.assertIn('username', data['user'])
        self.assertIn('transport', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_retrieve_detail_has_more_fields_than_list(self):
        list_response = self.client.get('/api/v1/drivers/')
        detail_response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        list_fields = set(list_response.json()['results'][0].keys())
        detail_fields = set(detail_response.json().keys())
        self.assertGreater(len(detail_fields), len(list_fields))

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverCreateViewTests(DriverViewSetSetupMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.new_driver_user = User.objects.create_user(
            username='oscar.mejia',
            password='SecurePass123!',
            first_name='Oscar',
            last_name='Mejia',
            email='oscar.mejia@transportes.co',
        )
        self.new_transport = Transport.objects.create(
            name='Van Reparto Cali',
            license_plate='CAL-099',
            vehicle_type=Transport.VehicleType.VAN,
            capacity_kg='1800.00',
            capacity_m3='9.00',
        )

    def test_create_valid_driver_returns_201(self):
        data = {
            'user': self.new_driver_user.pk,
            'transport': self.new_transport.pk,
            'license_number': 'COL-B2-98765432',
            'phone': '+57 300 900 8877',
            'is_available': True,
            'is_active': True,
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_driver_without_transport_returns_201(self):
        data = {
            'user': self.new_driver_user.pk,
            'license_number': 'COL-C1-11223355',
            'phone': '+57 318 100 2233',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_driver_persisted_in_database(self):
        data = {
            'user': self.new_driver_user.pk,
            'license_number': 'COL-A2-55443322',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Driver.objects.filter(license_number='COL-A2-55443322').exists())

    def test_create_without_auth_returns_401(self):
        self.client.credentials()
        data = {
            'user': self.new_driver_user.pk,
            'license_number': 'COL-B2-00998877',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_user_returns_400(self):
        data = {
            'license_number': 'COL-B2-44332211',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.json()['error'])

    def test_create_missing_license_number_returns_400(self):
        data = {
            'user': self.new_driver_user.pk,
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_number', response.json()['error'])

    def test_create_duplicate_license_number_returns_400(self):
        data = {
            'user': self.new_driver_user.pk,
            'license_number': 'COL-B2-10203040',  # already exists in setUp
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_number', response.json()['error'])

    def test_create_with_nonexistent_user_id_returns_400(self):
        data = {
            'user': 99999,
            'license_number': 'COL-B2-77665544',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.json()['error'])

    def test_create_with_nonexistent_transport_id_returns_400(self):
        data = {
            'user': self.new_driver_user.pk,
            'transport': 99999,
            'license_number': 'COL-B2-33221100',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('transport', response.json()['error'])

    def test_create_with_already_used_user_returns_400(self):
        # self.driver_user is already assigned to self.driver (OneToOne)
        data = {
            'user': self.driver_user.pk,
            'license_number': 'COL-C1-99009900',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.json()['error'])


class DriverUpdateViewTests(DriverViewSetSetupMixin, APITestCase):
    def test_patch_phone_returns_200(self):
        data = {'phone': '+57 312 999 0011'}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_value_in_database(self):
        data = {'phone': '+57 312 888 7766'}
        self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '+57 312 888 7766')

    def test_patch_assign_transport_returns_200(self):
        second_transport = Transport.objects.create(
            name='Moto Mensajeria Norte',
            license_plate='BOG-MOT-01',
            vehicle_type=Transport.VehicleType.MOTORCYCLE,
            capacity_kg='30.00',
            capacity_m3='0.30',
        )
        data = {'transport': second_transport.pk}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_deassign_transport_returns_200(self):
        data = {'transport': None}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertIsNone(self.driver.transport)

    def test_patch_is_available_false_returns_200(self):
        data = {'is_available': False}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_available)

    def test_patch_nonexistent_driver_returns_404(self):
        data = {'phone': '+57 312 000 0000'}
        response = self.client.patch('/api/v1/drivers/99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_without_auth_returns_401(self):
        self.client.credentials()
        data = {'phone': '+57 312 000 0001'}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_full_update_returns_200(self):
        put_user = User.objects.create_user(
            username='valentina.rios',
            password='SecurePass123!',
            first_name='Valentina',
            last_name='Rios',
        )
        data = {
            'user': put_user.pk,
            'license_number': 'COL-B2-PUT00001',
            'phone': '+57 320 100 2200',
            'is_available': False,
            'is_active': True,
        }
        response = self.client.put(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class DriverDeleteViewTests(DriverViewSetSetupMixin, APITestCase):
    def test_delete_returns_204(self):
        response = self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_driver_from_database(self):
        driver_pk = self.driver.pk
        self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_without_auth_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
