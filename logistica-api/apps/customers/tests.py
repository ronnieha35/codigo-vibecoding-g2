from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer
from apps.customers.serializers import (
    CustomerDetailSerializer,
    CustomerListSerializer,
    CustomerWriteSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_customer(**kwargs):
    """Create a Customer instance with sensible defaults."""
    defaults = {
        'name': 'Tech Supplies S.A.',
        'customer_type': Customer.CustomerType.COMPANY,
        'email': 'contacto@techsupplies.com',
        'phone': '+57 310 555 1234',
        'address': 'Calle 80 #45-12, Bogotá',
        'city': 'Bogotá',
        'country': 'Colombia',
        'tax_id': '900123456-7',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


# ===========================================================================
# Model Tests
# ===========================================================================

class CustomerModelHappyPathTests(TestCase):

    def test_create_customer_company_success(self):
        customer = make_customer()
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.name, 'Tech Supplies S.A.')
        self.assertEqual(customer.customer_type, 'COMPANY')
        self.assertEqual(customer.email, 'contacto@techsupplies.com')
        self.assertTrue(customer.is_active)

    def test_create_customer_person_success(self):
        customer = make_customer(
            name='Carlos Mendoza',
            customer_type=Customer.CustomerType.PERSON,
            email='cmendoza@gmail.com',
            tax_id='1020304050',
        )
        self.assertEqual(customer.customer_type, 'PERSON')
        self.assertEqual(customer.email, 'cmendoza@gmail.com')

    def test_str_representation_returns_name(self):
        customer = make_customer()
        self.assertEqual(str(customer), 'Tech Supplies S.A.')

    def test_is_active_defaults_to_true(self):
        customer = make_customer()
        self.assertTrue(customer.is_active)

    def test_created_at_and_updated_at_auto_populated(self):
        customer = make_customer()
        self.assertIsNotNone(customer.created_at)
        self.assertIsNotNone(customer.updated_at)

    def test_optional_fields_can_be_blank(self):
        """phone, address, city, country, tax_id are all optional."""
        customer = Customer.objects.create(
            name='Inversiones Digitales Ltda.',
            customer_type=Customer.CustomerType.COMPANY,
            email='info@invdigitales.co',
        )
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.phone, '')
        self.assertEqual(customer.address, '')
        self.assertIsNone(customer.tax_id)


class CustomerModelUnhappyPathTests(TestCase):

    def setUp(self):
        self.existing = make_customer()

    def test_duplicate_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            make_customer(
                name='Otra Empresa S.A.',
                email='contacto@techsupplies.com',  # same as existing
                tax_id='800999888-1',
            )

    def test_duplicate_tax_id_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            make_customer(
                name='Otra Empresa S.A.',
                email='otraempresa@example.com',
                tax_id='900123456-7',  # same as existing
            )

    def test_missing_name_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name=None,
                customer_type=Customer.CustomerType.COMPANY,
                email='noname@company.com',
            )

    def test_missing_customer_type_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa Sin Tipo',
                customer_type=None,
                email='sintype@company.com',
            )

    def test_missing_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa Sin Email',
                customer_type=Customer.CustomerType.COMPANY,
                email=None,
            )


class CustomerModelEdgeCaseTests(TestCase):

    def test_tax_id_can_be_null_for_multiple_customers(self):
        """Multiple customers can have tax_id=None (NULL is not UNIQUE-constrained)."""
        c1 = Customer.objects.create(
            name='Empresa Uno S.A.',
            customer_type=Customer.CustomerType.COMPANY,
            email='empresa1@uno.com',
            tax_id=None,
        )
        c2 = Customer.objects.create(
            name='Empresa Dos S.A.',
            customer_type=Customer.CustomerType.COMPANY,
            email='empresa2@dos.com',
            tax_id=None,
        )
        self.assertIsNone(c1.tax_id)
        self.assertIsNone(c2.tax_id)

    def test_invalid_customer_type_choice_raises_validation_error(self):
        """A value outside the defined choices fails full_clean()."""
        customer = Customer(
            name='Empresa Invalida S.A.',
            customer_type='INVALID_TYPE',
            email='invalida@empresa.com',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_fk_user_set_null_on_delete(self):
        """Deleting the linked user sets customer.user to NULL (SET_NULL)."""
        user = User.objects.create_user(
            username='clienteuser', password='SecurePass123!'
        )
        customer = make_customer(user=user, email='clienteconuser@techsupplies.com')
        self.assertEqual(customer.user, user)

        user.delete()
        customer.refresh_from_db()
        self.assertIsNone(customer.user)

    def test_customer_without_user_fk_is_valid(self):
        """user is optional — customer can exist without it."""
        customer = make_customer(user=None, email='sinusuario@empresa.com')
        self.assertIsNone(customer.user)

    def test_name_max_length_200_accepted(self):
        long_name = 'A' * 200
        customer = make_customer(name=long_name, email='largoname@empresa.com')
        self.assertEqual(len(customer.name), 200)


# ===========================================================================
# Serializer Tests
# ===========================================================================

class CustomerWriteSerializerHappyPathTests(TestCase):

    def _valid_data(self, **overrides):
        data = {
            'name': 'DataCore Colombia S.A.S.',
            'customer_type': 'COMPANY',
            'email': 'ventas@datacore.co',
            'phone': '+57 1 234 5678',
            'address': 'Av. El Dorado #68C-61, Bogotá',
            'city': 'Bogotá',
            'country': 'Colombia',
            'tax_id': '901234567-8',
            'is_active': True,
        }
        data.update(overrides)
        return data

    def test_valid_data_passes_validation(self):
        serializer = CustomerWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_object_in_db(self):
        serializer = CustomerWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid())
        customer = serializer.save()
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.email, 'ventas@datacore.co')

    def test_optional_fields_omitted_still_valid(self):
        data = {
            'name': 'Minimal Tech Ltda.',
            'customer_type': 'PERSON',
            'email': 'minimal@techltda.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_tax_id_null_accepted(self):
        data = self._valid_data(tax_id=None, email='notaxid@datacore.co')
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_person_type_accepted(self):
        data = self._valid_data(
            customer_type='PERSON',
            email='persona@natural.co',
            tax_id='1019287364',
        )
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class CustomerWriteSerializerUnhappyPathTests(TestCase):

    def setUp(self):
        # Existing customer for unique constraint checks
        self.existing = Customer.objects.create(
            name='Sistemas Globales S.A.',
            customer_type='COMPANY',
            email='sistemas@globales.com',
            tax_id='800456789-2',
        )

    def test_missing_name_is_invalid(self):
        data = {
            'customer_type': 'COMPANY',
            'email': 'noname@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_customer_type_is_invalid(self):
        data = {
            'name': 'Empresa Sin Tipo',
            'email': 'sintype@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_missing_email_is_invalid(self):
        data = {
            'name': 'Empresa Sin Email',
            'customer_type': 'COMPANY',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_malformed_email_is_invalid(self):
        data = {
            'name': 'Email Malo Ltda.',
            'customer_type': 'COMPANY',
            'email': 'no-es-un-email-valido',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_is_invalid(self):
        data = {
            'name': 'Empresa Duplicada',
            'customer_type': 'COMPANY',
            'email': 'sistemas@globales.com',  # already exists
            'tax_id': '999888777-1',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_tax_id_is_invalid(self):
        data = {
            'name': 'Empresa Duplicada',
            'customer_type': 'COMPANY',
            'email': 'nuevo@empresa.com',
            'tax_id': '800456789-2',  # already exists
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tax_id', serializer.errors)

    def test_invalid_customer_type_choice_is_invalid(self):
        data = {
            'name': 'Empresa Tipo Raro',
            'customer_type': 'CORPORATION',  # not a valid choice
            'email': 'tiporaro@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_blank_name_is_invalid(self):
        data = {
            'name': '',
            'customer_type': 'COMPANY',
            'email': 'blankname@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_blank_email_is_invalid(self):
        data = {
            'name': 'Empresa Ok',
            'customer_type': 'COMPANY',
            'email': '',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class CustomerSerializerEdgeCaseTests(TestCase):

    def test_created_at_and_updated_at_not_writable(self):
        """created_at and updated_at are not in CustomerWriteSerializer fields."""
        fields = CustomerWriteSerializer().fields
        self.assertNotIn('created_at', fields)
        self.assertNotIn('updated_at', fields)

    def test_id_not_writable_via_write_serializer(self):
        """id is not part of CustomerWriteSerializer fields."""
        fields = CustomerWriteSerializer().fields
        self.assertNotIn('id', fields)

    def test_list_serializer_has_fewer_fields_than_detail(self):
        list_fields = set(CustomerListSerializer().fields.keys())
        detail_fields = set(CustomerDetailSerializer().fields.keys())
        self.assertTrue(list_fields < detail_fields)

    def test_detail_serializer_includes_all_expected_fields(self):
        expected = {
            'id', 'user', 'name', 'customer_type', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
            'created_at', 'updated_at',
        }
        actual = set(CustomerDetailSerializer().fields.keys())
        self.assertEqual(actual, expected)

    def test_list_serializer_fields_are_subset(self):
        expected = {'id', 'name', 'customer_type', 'email', 'city', 'is_active'}
        actual = set(CustomerListSerializer().fields.keys())
        self.assertEqual(actual, expected)

    def test_user_fk_is_not_required(self):
        """user field is optional — serializer should not require it."""
        data = {
            'name': 'Sin Usuario S.A.',
            'customer_type': 'COMPANY',
            'email': 'sinusuario@empresa.com',
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_user_fk_id_is_invalid(self):
        """Providing a user FK that does not exist should fail validation."""
        data = {
            'name': 'Empresa con FK mala',
            'customer_type': 'COMPANY',
            'email': 'fkmala@empresa.com',
            'user': 99999,  # does not exist
        }
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)


# ===========================================================================
# View / Endpoint Tests
# ===========================================================================

class CustomerViewSetHappyPathTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='tester', password='SecurePass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        self.customer = Customer.objects.create(
            name='InnovaLogística S.A.',
            customer_type='COMPANY',
            email='contacto@innovalogistica.co',
            phone='+57 4 444 5678',
            address='Carrera 50 #32-10, Medellín',
            city='Medellín',
            country='Colombia',
            tax_id='830500763-1',
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_has_pagination_structure(self):
        response = self.client.get('/api/v1/customers/')
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)

    def test_list_count_matches_active_customers(self):
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.json()['count'], 1)

    def test_list_uses_list_serializer_fields(self):
        response = self.client.get('/api/v1/customers/')
        result = response.json()['results'][0]
        expected_keys = {'id', 'name', 'customer_type', 'email', 'city', 'is_active'}
        self.assertEqual(set(result.keys()), expected_keys)

    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_uses_detail_serializer_fields(self):
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        data = response.json()
        self.assertIn('phone', data)
        self.assertIn('address', data)
        self.assertIn('country', data)
        self.assertIn('tax_id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_retrieve_returns_correct_customer(self):
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.json()['email'], 'contacto@innovalogistica.co')

    def test_create_returns_201(self):
        payload = {
            'name': 'TecnoAndina Perú S.A.C.',
            'customer_type': 'COMPANY',
            'email': 'ventas@tecnoandina.pe',
            'phone': '+51 1 234 5678',
            'city': 'Lima',
            'country': 'Perú',
            'tax_id': '20512345671',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_persists_to_database(self):
        payload = {
            'name': 'Digital Express México S. de R.L.',
            'customer_type': 'COMPANY',
            'email': 'hola@digitalexpress.mx',
            'tax_id': 'DEM900101ABC',
        }
        self.client.post('/api/v1/customers/', payload, format='json')
        self.assertTrue(
            Customer.objects.filter(email='hola@digitalexpress.mx').exists()
        )

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            f'/api/v1/customers/{self.customer.pk}/',
            {'city': 'Bogotá'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_changes_field(self):
        self.client.patch(
            f'/api/v1/customers/{self.customer.pk}/',
            {'city': 'Cali'},
            format='json',
        )
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.city, 'Cali')

    def test_full_update_returns_200(self):
        payload = {
            'name': 'InnovaLogística S.A.',
            'customer_type': 'COMPANY',
            'email': 'actualizado@innovalogistica.co',
            'phone': '+57 4 444 9999',
            'address': 'Carrera 50 #32-10, Medellín',
            'city': 'Medellín',
            'country': 'Colombia',
            'tax_id': '830500763-1',
            'is_active': True,
        }
        response = self.client.put(
            f'/api/v1/customers/{self.customer.pk}/', payload, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_returns_204(self):
        response = self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.assertFalse(Customer.objects.filter(pk=self.customer.pk).exists())


class CustomerViewSetAuthTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='authtest', password='SecurePass123!'
        )
        Customer.objects.create(
            name='Logística Caribe S.A.',
            customer_type='COMPANY',
            email='info@logisticacaribe.com',
            tax_id='890987654-3',
        )

    def test_list_without_token_returns_401(self):
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_token_returns_401(self):
        payload = {
            'name': 'Empresa Sin Auth',
            'customer_type': 'COMPANY',
            'email': 'sinauth@empresa.com',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_token_returns_401(self):
        customer = Customer.objects.first()
        response = self.client.get(f'/api/v1/customers/{customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_without_token_returns_401(self):
        customer = Customer.objects.first()
        response = self.client.patch(
            f'/api/v1/customers/{customer.pk}/', {'city': 'Lima'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_token_returns_401(self):
        customer = Customer.objects.first()
        response = self.client.delete(f'/api/v1/customers/{customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerViewSetValidationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='valtest', password='SecurePass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
        self.customer = Customer.objects.create(
            name='Nexus Tecnología S.A.',
            customer_type='COMPANY',
            email='nexus@tecnologia.com',
            tax_id='900876543-2',
        )

    def test_create_missing_required_name_returns_400(self):
        payload = {
            'customer_type': 'COMPANY',
            'email': 'sinname@empresa.com',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data['error'])

    def test_create_missing_email_returns_400(self):
        payload = {
            'name': 'Empresa Sin Email',
            'customer_type': 'COMPANY',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['error'])

    def test_create_missing_customer_type_returns_400(self):
        payload = {
            'name': 'Empresa Sin Tipo',
            'email': 'sintype@empresa.com',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data['error'])

    def test_create_invalid_email_format_returns_400(self):
        payload = {
            'name': 'Empresa Email Malo',
            'customer_type': 'COMPANY',
            'email': 'esto-no-es-un-email',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['error'])

    def test_create_duplicate_email_returns_400(self):
        payload = {
            'name': 'Nexus Copia',
            'customer_type': 'COMPANY',
            'email': 'nexus@tecnologia.com',  # duplicado
            'tax_id': '111222333-9',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['error'])

    def test_create_duplicate_tax_id_returns_400(self):
        payload = {
            'name': 'Nexus Copia 2',
            'customer_type': 'COMPANY',
            'email': 'nexuscopia2@tecnologia.com',
            'tax_id': '900876543-2',  # duplicado
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data['error'])

    def test_create_invalid_customer_type_returns_400(self):
        payload = {
            'name': 'Empresa Tipo Invalido',
            'customer_type': 'CORPORATION',
            'email': 'tipoinvalido@empresa.com',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data['error'])

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_partial_update_nonexistent_returns_404(self):
        response = self.client.patch(
            '/api/v1/customers/99999/', {'city': 'Lima'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete('/api/v1/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_invalid_user_fk_returns_400(self):
        payload = {
            'name': 'Empresa FK Mala',
            'customer_type': 'COMPANY',
            'email': 'fkmala@empresa.com',
            'user': 99999,  # no existe
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.data['error'])


class CustomerViewSetEdgeCaseTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='edgetest', password='SecurePass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        self.active_customer = Customer.objects.create(
            name='Activa Tecnología S.A.',
            customer_type='COMPANY',
            email='activa@tecnologia.com',
            tax_id='900111222-3',
        )
        self.inactive_customer = Customer.objects.create(
            name='Inactiva Tecnología S.A.',
            customer_type='COMPANY',
            email='inactiva@tecnologia.com',
            tax_id='900333444-5',
            is_active=False,
        )

    def test_inactive_customer_not_in_list(self):
        response = self.client.get('/api/v1/customers/')
        results = response.json()['results']
        emails = [r['email'] for r in results]
        self.assertNotIn('inactiva@tecnologia.com', emails)

    def test_active_customer_appears_in_list(self):
        response = self.client.get('/api/v1/customers/')
        results = response.json()['results']
        emails = [r['email'] for r in results]
        self.assertIn('activa@tecnologia.com', emails)

    def test_retrieve_inactive_customer_returns_404(self):
        """Inactive customers are not in the queryset, so retrieve returns 404."""
        response = self.client.get(f'/api/v1/customers/{self.inactive_customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_serializer_has_fewer_fields_than_detail_in_response(self):
        list_response = self.client.get('/api/v1/customers/')
        list_result = list_response.json()['results'][0]

        detail_response = self.client.get(f'/api/v1/customers/{self.active_customer.pk}/')
        detail_result = detail_response.json()

        self.assertLess(len(list_result.keys()), len(detail_result.keys()))

    def test_create_customer_person_type_succeeds(self):
        payload = {
            'name': 'Valentina Ríos',
            'customer_type': 'PERSON',
            'email': 'vrios@clientes.co',
            'tax_id': '1030405060',
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_multiple_customers_tax_id_null_allowed(self):
        """Two customers with tax_id=None should both be creatable."""
        payload1 = {
            'name': 'Empresa Sin NIT Uno',
            'customer_type': 'COMPANY',
            'email': 'sinniuno@empresa.com',
        }
        payload2 = {
            'name': 'Empresa Sin NIT Dos',
            'customer_type': 'COMPANY',
            'email': 'sinnidos@empresa.com',
        }
        r1 = self.client.post('/api/v1/customers/', payload1, format='json')
        r2 = self.client.post('/api/v1/customers/', payload2, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_error_response_structure_has_error_key(self):
        """Custom exception handler wraps errors under 'error' key."""
        payload = {
            'name': 'Empresa sin tipo',
            'email': 'sintipo@empresa.com',
            # customer_type missing
        }
        response = self.client.post('/api/v1/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('status_code', response.data)
        self.assertEqual(response.data['status_code'], 400)
