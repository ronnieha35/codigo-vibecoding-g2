from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductViewSetTests(APITestCase):
    def setUp(self):
        # Autenticación
        self.user = User.objects.create_user(
            username='tester_products',
            password='SecurePass123!',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Fixtures
        self.supplier = Supplier.objects.create(
            name='Lenovo Latin America S.A.',
            email='negocios@lenovo-latam.com',
            phone='+57 601 555 0700',
            address='Calle 100 #9-80, Bogotá',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-500222333-5',
            contact_name='Andrés Mejía',
        )
        self.supplier_2 = Supplier.objects.create(
            name='Intel Corporation Colombia',
            email='distribucion@intel.com.co',
            phone='+57 601 555 0800',
            tax_id='NIT-400111222-6',
        )
        self.warehouse = Warehouse.objects.create(
            name='CEDI Barranquilla',
            address='Cra 46 #72-120, Barranquilla',
            city='Barranquilla',
            country='Colombia',
            phone='+57 605 555 0900',
            capacity_m3=Decimal('3200.00'),
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Lenovo ThinkStation P620',
            sku='SKU-LENOVO-P620-001',
            description='Workstation AMD Threadripper Pro',
            category='workstations',
            unit_price=Decimal('4599.99'),
            weight_kg=Decimal('17.500'),
            length_cm=Decimal('45.00'),
            width_cm=Decimal('21.50'),
            height_cm=Decimal('47.80'),
            stock_quantity=5,
            is_active=True,
        )
        self.list_url = '/api/v1/products/'
        self.detail_url = f'/api/v1/products/{self.product.pk}/'

    # ── Happy path — CRUD completo ───────────────────────────────────────────

    def test_list_returns_200(self):
        """GET /api/v1/products/ con token válido → 200."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_pagination_structure(self):
        """GET /api/v1/products/ → respuesta con count, next, previous, results."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)
        self.assertEqual(data['count'], 1)
        self.assertEqual(len(data['results']), 1)

    def test_create_product_returns_201(self):
        """POST /api/v1/products/ con datos válidos → 201 y producto creado."""
        payload = {
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
            'name': 'Lenovo ThinkPad T14s Gen 3',
            'sku': 'SKU-LENOVO-T14S-G3-001',
            'description': 'Laptop empresarial 14" AMD Ryzen 7',
            'category': 'laptops',
            'unit_price': '1549.99',
            'weight_kg': '1.410',
            'stock_quantity': 15,
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)

    def test_retrieve_product_returns_200(self):
        """GET /api/v1/products/{id}/ con token válido → 200 con datos del producto."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['id'], self.product.pk)
        self.assertEqual(data['sku'], 'SKU-LENOVO-P620-001')

    def test_partial_update_product_returns_200(self):
        """PATCH /api/v1/products/{id}/ con campo válido → 200."""
        response = self.client.patch(
            self.detail_url,
            data={'stock_quantity': 10},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 10)

    def test_full_update_product_returns_200(self):
        """PUT /api/v1/products/{id}/ con datos completos → 200."""
        payload = {
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
            'name': 'Lenovo ThinkStation P620 Updated',
            'sku': 'SKU-LENOVO-P620-001',
            'description': 'Workstation AMD Threadripper Pro — versión actualizada',
            'category': 'workstations',
            'unit_price': '4799.99',
            'weight_kg': '17.500',
            'stock_quantity': 3,
            'is_active': True,
        }
        response = self.client.put(self.detail_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_product_returns_204(self):
        """DELETE /api/v1/products/{id}/ con token válido → 204."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)

    # ── Unhappy path — autenticación ─────────────────────────────────────────

    def test_list_without_auth_returns_401(self):
        """GET /api/v1/products/ sin token → 401."""
        self.client.credentials()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_auth_returns_401(self):
        """POST /api/v1/products/ sin token → 401."""
        self.client.credentials()
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Cisco Meraki MX68',
            'sku': 'SKU-CISCO-MX68-001',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_auth_returns_401(self):
        """GET /api/v1/products/{id}/ sin token → 401."""
        self.client.credentials()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        """Token malformado → 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token_invalido_xyz')
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Unhappy path — validación ─────────────────────────────────────────────

    def test_create_missing_name_returns_400(self):
        """POST sin 'name' → 400 con detalle del campo en response.data['error']."""
        payload = {
            'supplier': self.supplier.pk,
            'sku': 'SKU-MISSING-NAME-VIEWS-001',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('name', response.data['error'])

    def test_create_missing_supplier_returns_400(self):
        """POST sin 'supplier' → 400 con error en 'supplier'."""
        payload = {
            'name': 'Juniper QFX5120',
            'sku': 'SKU-JUNIPER-QFX5120-001',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('supplier', response.data['error'])

    def test_create_missing_sku_returns_400(self):
        """POST sin 'sku' → 400 con error en 'sku'."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Ubiquiti EdgeRouter 4',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('sku', response.data['error'])

    def test_create_duplicate_sku_returns_400(self):
        """POST con SKU ya existente → 400 con error en 'sku'."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Lenovo ThinkStation P620 Copia',
            'sku': 'SKU-LENOVO-P620-001',  # duplicado
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('sku', response.data['error'])

    def test_create_with_nonexistent_supplier_returns_400(self):
        """POST con supplier_id inexistente → 400 con error en 'supplier'."""
        payload = {
            'supplier': 99999,
            'name': 'Synology DS923+',
            'sku': 'SKU-SYN-DS923P-001',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('supplier', response.data['error'])

    def test_create_with_nonexistent_warehouse_returns_400(self):
        """POST con warehouse_id inexistente → 400 con error en 'warehouse'."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Synology DS1522+',
            'sku': 'SKU-SYN-DS1522P-001',
            'warehouse': 99999,
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('warehouse', response.data['error'])

    def test_create_with_negative_unit_price_returns_400(self):
        """POST con unit_price negativo → 400 con error en 'unit_price'."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'WD Red Pro 4TB',
            'sku': 'SKU-WD-REDPRO-4TB-001',
            'unit_price': '-50.00',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('unit_price', response.data['error'])

    def test_retrieve_nonexistent_product_returns_404(self):
        """GET /api/v1/products/99999/ → 404."""
        response = self.client.get('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_product_returns_404(self):
        """PATCH /api/v1/products/99999/ → 404."""
        response = self.client.patch(
            '/api/v1/products/99999/',
            data={'stock_quantity': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_product_returns_404(self):
        """DELETE /api/v1/products/99999/ → 404."""
        response = self.client.delete('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Edge cases ────────────────────────────────────────────────────────────

    def test_inactive_product_not_in_list(self):
        """Producto con is_active=False no aparece en GET list."""
        inactive_product = Product.objects.create(
            supplier=self.supplier,
            name='Motorola Solutions MC9300',
            sku='SKU-MOTO-MC9300-001',
            is_active=False,
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        ids_in_results = [p['id'] for p in data['results']]
        self.assertNotIn(inactive_product.pk, ids_in_results)
        self.assertEqual(data['count'], 1)

    def test_inactive_product_not_retrievable(self):
        """GET /api/v1/products/{id}/ de producto inactivo → 404 (filtrado en queryset)."""
        inactive_product = Product.objects.create(
            supplier=self.supplier,
            name='Garmin GPSMAP 276Cx',
            sku='SKU-GARMIN-276CX-001',
            is_active=False,
        )
        response = self.client.get(f'/api/v1/products/{inactive_product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_serializer_has_fewer_fields_than_detail(self):
        """GET list → campos menos que GET retrieve (list vs detail serializer)."""
        list_response = self.client.get(self.list_url)
        detail_response = self.client.get(self.detail_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        list_fields = set(list_response.json()['results'][0].keys())
        detail_fields = set(detail_response.json().keys())
        self.assertLess(len(list_fields), len(detail_fields))
        # Los campos del list deben ser subconjunto del detail
        # (o al menos el detail debe tener más campos)
        self.assertIn('supplier', detail_fields)
        self.assertNotIn('supplier', list_fields)

    def test_list_shows_only_active_products_multiple(self):
        """Lista solo incluye productos activos cuando hay mezcla de activos/inactivos."""
        # Crear 2 activos y 2 inactivos adicionales
        Product.objects.create(
            supplier=self.supplier,
            name='Brocade ICX 7150',
            sku='SKU-BROCADE-ICX7150-001',
            is_active=True,
        )
        Product.objects.create(
            supplier=self.supplier,
            name='Extreme Networks X440-G2',
            sku='SKU-EXTR-X440G2-001',
            is_active=False,
        )
        Product.objects.create(
            supplier=self.supplier,
            name='Fortinet FortiGate 60F',
            sku='SKU-FORT-FG60F-001',
            is_active=False,
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Solo los 2 activos (1 del setUp + 1 nuevo)
        self.assertEqual(data['count'], 2)

    def test_create_product_response_body_structure(self):
        """POST exitoso → respuesta incluye campos del WriteSerializer (name, sku, supplier)."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Palo Alto PA-3220',
            'sku': 'SKU-PALO-PA3220-001',
            'category': 'security',
            'unit_price': '7999.00',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        # La respuesta usa ProductWriteSerializer que no expone 'id'
        self.assertIn('name', data)
        self.assertIn('sku', data)
        self.assertIn('supplier', data)
        self.assertEqual(data['name'], 'Palo Alto PA-3220')
        self.assertEqual(data['sku'], 'SKU-PALO-PA3220-001')

    def test_partial_update_preserves_existing_fields(self):
        """PATCH solo el campo enviado cambia; el resto se mantiene."""
        original_sku = self.product.sku
        response = self.client.patch(
            self.detail_url,
            data={'category': 'servers'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.category, 'servers')
        self.assertEqual(self.product.sku, original_sku)

    def test_create_product_without_warehouse_returns_201(self):
        """POST sin warehouse (campo opcional) → 201."""
        payload = {
            'supplier': self.supplier.pk,
            'name': 'Riverbed SteelHead CX570',
            'sku': 'SKU-RVBD-CX570-001',
        }
        response = self.client.post(self.list_url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_with_multiple_products_paginates_correctly(self):
        """Con múltiples productos, count refleja el número correcto de activos."""
        for i in range(5):
            Product.objects.create(
                supplier=self.supplier,
                name=f'Cisco Catalyst 9300 Unit {i + 1}',
                sku=f'SKU-CISCO-C9300-00{i + 2}',
                is_active=True,
            )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # 1 del setUp + 5 nuevos = 6 activos
        self.assertEqual(data['count'], 6)
