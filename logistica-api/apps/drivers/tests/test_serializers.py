from django.contrib.auth.models import User
from django.test import TestCase

from apps.drivers.models import Driver
from apps.drivers.serializers import (
    DriverDetailSerializer,
    DriverListSerializer,
    DriverWriteSerializer,
)
from apps.transport.models import Transport


class DriverWriteSerializerHappyPathTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='fernando.reyes',
            password='SecurePass123!',
            first_name='Fernando',
            last_name='Reyes',
            email='fernando.reyes@transportes.com',
        )
        self.transport = Transport.objects.create(
            name='Camion Mediano Bogota',
            license_plate='TGH-456',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg='3000.00',
            capacity_m3='15.00',
        )

    def test_valid_data_with_transport_is_valid(self):
        data = {
            'user': self.user.pk,
            'transport': self.transport.pk,
            'license_number': 'COL-B2-30405060',
            'phone': '+57 321 600 7788',
            'is_available': True,
            'is_active': True,
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_driver(self):
        data = {
            'user': self.user.pk,
            'transport': self.transport.pk,
            'license_number': 'COL-B2-71829304',
            'phone': '+57 300 111 2233',
            'is_available': True,
            'is_active': True,
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        driver = serializer.save()
        self.assertIsNotNone(driver.pk)
        self.assertEqual(driver.license_number, 'COL-B2-71829304')
        self.assertEqual(driver.user, self.user)
        self.assertEqual(driver.transport, self.transport)

    def test_valid_data_without_transport_is_valid(self):
        data = {
            'user': self.user.pk,
            'license_number': 'COL-C1-98761234',
            'phone': '+57 314 999 8877',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_without_transport_creates_driver_with_null_transport(self):
        data = {
            'user': self.user.pk,
            'license_number': 'COL-A2-12349876',
            'phone': '+57 317 555 4433',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        driver = serializer.save()
        self.assertIsNone(driver.transport)

    def test_transport_explicit_null_is_valid(self):
        data = {
            'user': self.user.pk,
            'transport': None,
            'license_number': 'COL-B1-56781234',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_phone_blank_is_valid(self):
        data = {
            'user': self.user.pk,
            'license_number': 'COL-B2-00112233',
            'phone': '',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class DriverWriteSerializerUnhappyPathTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='camila.vargas',
            password='SecurePass123!',
            first_name='Camila',
            last_name='Vargas',
        )
        self.transport = Transport.objects.create(
            name='Van Urbana Medellin',
            license_plate='MED-321',
            vehicle_type=Transport.VehicleType.VAN,
            capacity_kg='1200.00',
            capacity_m3='6.00',
        )
        # Create an existing driver to test duplicates
        self.existing_driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-11223344',
        )

    def test_missing_user_is_invalid(self):
        data = {
            'license_number': 'COL-B2-55667788',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)

    def test_missing_license_number_is_invalid(self):
        new_user = User.objects.create_user(
            username='jose.hernandez',
            password='SecurePass123!',
        )
        data = {
            'user': new_user.pk,
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_duplicate_license_number_is_invalid(self):
        new_user = User.objects.create_user(
            username='miguel.torres',
            password='SecurePass123!',
        )
        data = {
            'user': new_user.pk,
            'license_number': 'COL-B2-11223344',  # already taken
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_nonexistent_user_id_is_invalid(self):
        data = {
            'user': 99999,
            'license_number': 'COL-B2-88776655',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)

    def test_nonexistent_transport_id_is_invalid(self):
        new_user = User.objects.create_user(
            username='sofia.morales',
            password='SecurePass123!',
        )
        data = {
            'user': new_user.pk,
            'transport': 99999,
            'license_number': 'COL-B2-77665544',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('transport', serializer.errors)

    def test_blank_license_number_is_invalid(self):
        new_user = User.objects.create_user(
            username='alejandro.castro',
            password='SecurePass123!',
        )
        data = {
            'user': new_user.pk,
            'license_number': '',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_duplicate_user_one_to_one_is_invalid(self):
        # user already has a driver (existing_driver), so reusing it must fail
        data = {
            'user': self.user.pk,
            'license_number': 'COL-C2-99887766',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)


class DriverListSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='natalia.diaz',
            password='SecurePass123!',
            first_name='Natalia',
            last_name='Diaz',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-44556677',
            phone='+57 316 222 3344',
            is_available=True,
            is_active=True,
        )

    def test_list_serializer_contains_expected_fields(self):
        serializer = DriverListSerializer(self.driver)
        data = serializer.data
        expected_fields = {'id', 'license_number', 'phone', 'is_available', 'is_active'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_list_serializer_does_not_contain_user_or_transport_detail(self):
        serializer = DriverListSerializer(self.driver)
        data = serializer.data
        self.assertNotIn('user', data)
        self.assertNotIn('transport', data)
        self.assertNotIn('created_at', data)
        self.assertNotIn('updated_at', data)


class DriverDetailSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='roberto.jimenez',
            password='SecurePass123!',
            first_name='Roberto',
            last_name='Jimenez',
            email='roberto.jimenez@envios.com',
        )
        self.transport = Transport.objects.create(
            name='Moto Mensajeria Cali',
            license_plate='CAL-555',
            vehicle_type=Transport.VehicleType.MOTORCYCLE,
            capacity_kg='50.00',
            capacity_m3='0.50',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            transport=self.transport,
            license_number='COL-A1-99001122',
            phone='+57 318 777 8899',
        )

    def test_detail_serializer_contains_expanded_user(self):
        serializer = DriverDetailSerializer(self.driver)
        data = serializer.data
        self.assertIn('user', data)
        user_data = data['user']
        self.assertIn('id', user_data)
        self.assertIn('username', user_data)
        self.assertIn('first_name', user_data)
        self.assertIn('last_name', user_data)
        self.assertIn('email', user_data)

    def test_detail_serializer_contains_expanded_transport(self):
        serializer = DriverDetailSerializer(self.driver)
        data = serializer.data
        self.assertIn('transport', data)
        transport_data = data['transport']
        self.assertIn('id', transport_data)
        self.assertIn('name', transport_data)
        self.assertIn('license_plate', transport_data)
        self.assertIn('vehicle_type', transport_data)

    def test_detail_serializer_contains_timestamps(self):
        serializer = DriverDetailSerializer(self.driver)
        data = serializer.data
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_detail_serializer_transport_null_when_not_assigned(self):
        driver_no_transport = Driver.objects.create(
            user=User.objects.create_user(
                username='sin.transporte',
                password='SecurePass123!',
            ),
            license_number='COL-B2-00001111',
        )
        serializer = DriverDetailSerializer(driver_no_transport)
        data = serializer.data
        self.assertIsNone(data['transport'])
