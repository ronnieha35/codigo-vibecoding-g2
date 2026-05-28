from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.drivers.models import Driver
from apps.transport.models import Transport


class DriverModelHappyPathTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='carlos.rodriguez',
            password='SecurePass123!',
            first_name='Carlos',
            last_name='Rodriguez',
            email='carlos.rodriguez@logistica.com',
        )
        self.transport = Transport.objects.create(
            name='Camion Pesado Norte',
            license_plate='ABC-123',
            vehicle_type=Transport.VehicleType.TRUCK,
            capacity_kg='5000.00',
            capacity_m3='20.00',
        )

    def test_create_driver_with_all_fields(self):
        driver = Driver.objects.create(
            user=self.user,
            transport=self.transport,
            license_number='COL-B2-12345678',
            phone='+57 310 555 0001',
            is_available=True,
            is_active=True,
        )
        self.assertIsNotNone(driver.pk)
        self.assertEqual(driver.license_number, 'COL-B2-12345678')
        self.assertEqual(driver.phone, '+57 310 555 0001')
        self.assertTrue(driver.is_available)
        self.assertTrue(driver.is_active)
        self.assertEqual(driver.user, self.user)
        self.assertEqual(driver.transport, self.transport)

    def test_create_driver_without_transport(self):
        driver = Driver.objects.create(
            user=self.user,
            transport=None,
            license_number='COL-B2-99887766',
            phone='+57 315 444 9900',
        )
        self.assertIsNotNone(driver.pk)
        self.assertIsNone(driver.transport)

    def test_str_representation_with_full_name(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-12345678',
        )
        expected = f'Carlos Rodriguez (COL-B2-12345678)'
        self.assertEqual(str(driver), expected)

    def test_str_representation_without_full_name(self):
        user_no_name = User.objects.create_user(
            username='sinombre',
            password='SecurePass123!',
        )
        driver = Driver.objects.create(
            user=user_no_name,
            license_number='COL-A1-00000001',
        )
        # get_full_name() returns '' when first_name and last_name are empty
        expected = f' (COL-A1-00000001)'
        self.assertEqual(str(driver), expected)

    def test_default_values_applied(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-C1-55554444',
        )
        self.assertTrue(driver.is_available)
        self.assertTrue(driver.is_active)

    def test_created_at_and_updated_at_set(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-11112222',
        )
        self.assertIsNotNone(driver.created_at)
        self.assertIsNotNone(driver.updated_at)

    def test_transport_null_accepted(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B1-77778888',
            transport=None,
        )
        self.assertIsNone(driver.transport)

    def test_phone_blank_accepted(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-C2-33334444',
            phone='',
        )
        self.assertEqual(driver.phone, '')


class DriverModelUnhappyPathTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='andres.gomez',
            password='SecurePass123!',
            first_name='Andres',
            last_name='Gomez',
        )
        Driver.objects.create(
            user=self.user,
            license_number='COL-B2-55556666',
        )

    def test_duplicate_license_number_raises_integrity_error(self):
        new_user = User.objects.create_user(
            username='maria.lopez',
            password='SecurePass123!',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=new_user,
                license_number='COL-B2-55556666',  # duplicate
            )

    def test_duplicate_user_one_to_one_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user,  # same user already has a driver
                license_number='COL-A2-99990000',
            )

    def test_license_number_null_raises_integrity_error(self):
        new_user = User.objects.create_user(
            username='pedro.sanchez',
            password='SecurePass123!',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=new_user,
                license_number=None,
            )

    def test_user_null_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=None,
                license_number='COL-B2-11223344',
            )


class DriverModelEdgeCaseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='lucia.martinez',
            password='SecurePass123!',
            first_name='Lucia',
            last_name='Martinez',
        )
        self.transport = Transport.objects.create(
            name='Furgoneta Reparto Sur',
            license_plate='XYZ-789',
            vehicle_type=Transport.VehicleType.VAN,
            capacity_kg='1500.00',
            capacity_m3='8.00',
        )

    def test_transport_set_null_on_transport_delete(self):
        driver = Driver.objects.create(
            user=self.user,
            transport=self.transport,
            license_number='COL-B2-24681357',
        )
        self.assertEqual(driver.transport, self.transport)
        self.transport.delete()
        driver.refresh_from_db()
        self.assertIsNone(driver.transport)

    def test_driver_deleted_on_user_cascade_delete(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-13572468',
        )
        driver_pk = driver.pk
        self.user.delete()
        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())

    def test_is_available_can_be_false(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-B2-11001100',
            is_available=False,
        )
        self.assertFalse(driver.is_available)

    def test_is_active_can_be_false(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='COL-C1-22002200',
            is_active=False,
        )
        self.assertFalse(driver.is_active)

    def test_db_table_name(self):
        self.assertEqual(Driver._meta.db_table, 'drivers_driver')
