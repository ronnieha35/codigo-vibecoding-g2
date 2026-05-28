from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Supplier
from .serializers import (
    SupplierDetailSerializer,
    SupplierListSerializer,
    SupplierWriteSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_supplier(**kwargs):
    """Crea un Supplier con datos realistas, aceptando overrides."""
    defaults = {
        "name": "Lenovo Colombia S.A.S.",
        "email": "proveedores@lenovo.com.co",
        "phone": "+57 601 555 7890",
        "address": "Carrera 7 #71-52, Torre B, Bogotá",
        "city": "Bogotá",
        "country": "Colombia",
        "tax_id": "900123456-1",
        "contact_name": "Andrea Moreno",
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

class SupplierModelHappyPathTests(TestCase):

    def test_create_supplier_with_all_fields_succeeds(self):
        supplier = make_supplier()
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.name, "Lenovo Colombia S.A.S.")
        self.assertEqual(supplier.email, "proveedores@lenovo.com.co")
        self.assertEqual(supplier.tax_id, "900123456-1")
        self.assertTrue(supplier.is_active)

    def test_create_supplier_with_only_required_fields_succeeds(self):
        """name, email, tax_id son los únicos NOT NULL sin default."""
        supplier = Supplier.objects.create(
            name="Samsung Electronics Colombia",
            email="contacto@samsung.com.co",
            tax_id="800987654-2",
        )
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.phone, "")
        self.assertEqual(supplier.address, "")
        self.assertEqual(supplier.city, "")
        self.assertEqual(supplier.country, "")
        self.assertEqual(supplier.contact_name, "")

    def test_str_returns_name(self):
        supplier = make_supplier()
        self.assertEqual(str(supplier), "Lenovo Colombia S.A.S.")

    def test_is_active_defaults_to_true(self):
        supplier = Supplier.objects.create(
            name="HP Inc. Colombia",
            email="ventas@hp.com.co",
            tax_id="860012345-3",
        )
        self.assertTrue(supplier.is_active)

    def test_created_at_and_updated_at_are_set_on_creation(self):
        supplier = make_supplier()
        self.assertIsNotNone(supplier.created_at)
        self.assertIsNotNone(supplier.updated_at)

    def test_db_table_name_is_correct(self):
        self.assertEqual(Supplier._meta.db_table, "suppliers_supplier")


class SupplierModelUnhappyPathTests(TestCase):

    def setUp(self):
        self.existing = make_supplier()

    def test_duplicate_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name="Otro Proveedor S.A.",
                email=self.existing.email,   # duplicado
                tax_id="111222333-9",
            )

    def test_duplicate_tax_id_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name="Proveedor Alternativo Ltda.",
                email="alternativo@proveedor.com",
                tax_id=self.existing.tax_id,  # duplicado
            )

    def test_missing_name_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name=None,
                email="sinombre@proveedor.com",
                tax_id="555666777-1",
            )

    def test_missing_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name="Proveedor Sin Email",
                email=None,
                tax_id="444555666-2",
            )

    def test_missing_tax_id_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name="Proveedor Sin RUC",
                email="sinruc@proveedor.com",
                tax_id=None,
            )


class SupplierModelEdgeCaseTests(TestCase):

    def test_supplier_with_is_active_false_can_be_created(self):
        supplier = Supplier.objects.create(
            name="Dell Technologies Colombia",
            email="inactivo@dell.com.co",
            tax_id="700111222-5",
            is_active=False,
        )
        self.assertFalse(supplier.is_active)
        self.assertIsNotNone(supplier.pk)

    def test_name_at_max_length_succeeds(self):
        long_name = "A" * 200
        supplier = Supplier.objects.create(
            name=long_name,
            email="longname@supplier.com",
            tax_id="300400500-6",
        )
        self.assertEqual(len(supplier.name), 200)

    def test_contact_name_at_max_length_succeeds(self):
        long_contact = "B" * 200
        supplier = Supplier.objects.create(
            name="Cisco Systems Colombia",
            email="cisco@cisco.com.co",
            tax_id="200300400-7",
            contact_name=long_contact,
        )
        self.assertEqual(len(supplier.contact_name), 200)

    def test_updated_at_changes_on_save(self):
        supplier = make_supplier()
        original_updated_at = supplier.updated_at
        supplier.city = "Medellín"
        supplier.save()
        supplier.refresh_from_db()
        self.assertGreaterEqual(supplier.updated_at, original_updated_at)

    def test_suppliers_with_different_emails_and_tax_ids_can_coexist(self):
        s1 = make_supplier()
        s2 = Supplier.objects.create(
            name="Microsoft Colombia S.A.S.",
            email="microsoft@microsoft.com.co",
            tax_id="830045678-8",
        )
        self.assertNotEqual(s1.pk, s2.pk)


# ---------------------------------------------------------------------------
# Serializer Tests
# ---------------------------------------------------------------------------

class SupplierWriteSerializerHappyPathTests(TestCase):

    def _valid_data(self, **overrides):
        data = {
            "name": "Intel Corporation Colombia",
            "email": "intel@intel.com.co",
            "phone": "+57 601 555 0001",
            "address": "Calle 93 #11-25, Piso 3",
            "city": "Bogotá",
            "country": "Colombia",
            "tax_id": "900876543-2",
            "contact_name": "Carlos Ruiz",
            "is_active": True,
        }
        data.update(overrides)
        return data

    def test_valid_data_passes_is_valid(self):
        serializer = SupplierWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_object_in_db(self):
        serializer = SupplierWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid())
        supplier = serializer.save()
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.name, "Intel Corporation Colombia")

    def test_optional_fields_can_be_omitted(self):
        data = {
            "name": "ASUS Colombia",
            "email": "asus@asus.com.co",
            "tax_id": "901234500-3",
        }
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_is_active_field_is_writable(self):
        data = self._valid_data(is_active=False)
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        supplier = serializer.save()
        self.assertFalse(supplier.is_active)


class SupplierWriteSerializerUnhappyPathTests(TestCase):

    def setUp(self):
        self.existing = Supplier.objects.create(
            name="LG Electronics Colombia",
            email="lg@lg.com.co",
            tax_id="800654321-1",
        )

    def _valid_data(self, **overrides):
        data = {
            "name": "Acer Colombia S.A.",
            "email": "acer@acer.com.co",
            "phone": "+57 601 555 0002",
            "address": "Cra 15 #82-36",
            "city": "Bogotá",
            "country": "Colombia",
            "tax_id": "900765432-9",
            "contact_name": "Laura Gómez",
        }
        data.update(overrides)
        return data

    def test_missing_name_is_invalid(self):
        data = self._valid_data()
        del data["name"]
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_missing_email_is_invalid(self):
        data = self._valid_data()
        del data["email"]
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_missing_tax_id_is_invalid(self):
        data = self._valid_data()
        del data["tax_id"]
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("tax_id", serializer.errors)

    def test_invalid_email_format_is_invalid(self):
        data = self._valid_data(email="not-an-email")
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_duplicate_email_is_invalid(self):
        data = self._valid_data(email=self.existing.email)
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_duplicate_tax_id_is_invalid(self):
        data = self._valid_data(tax_id=self.existing.tax_id)
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("tax_id", serializer.errors)


class SupplierWriteSerializerEdgeCaseTests(TestCase):

    def _valid_data(self, **overrides):
        data = {
            "name": "Toshiba Colombia",
            "email": "toshiba@toshiba.com.co",
            "tax_id": "860099887-5",
        }
        data.update(overrides)
        return data

    def test_blank_name_is_invalid(self):
        data = self._valid_data(name="")
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_blank_email_is_invalid(self):
        data = self._valid_data(email="")
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_blank_tax_id_is_invalid(self):
        data = self._valid_data(tax_id="")
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("tax_id", serializer.errors)

    def test_id_field_not_present_in_write_serializer_fields(self):
        """id es read-only — no debe estar en los campos editables del WriteSerializer."""
        write_fields = SupplierWriteSerializer().fields.keys()
        self.assertNotIn("id", write_fields)

    def test_created_at_not_in_write_serializer(self):
        write_fields = SupplierWriteSerializer().fields.keys()
        self.assertNotIn("created_at", write_fields)

    def test_updated_at_not_in_write_serializer(self):
        write_fields = SupplierWriteSerializer().fields.keys()
        self.assertNotIn("updated_at", write_fields)


class SupplierListSerializerTests(TestCase):

    def test_list_serializer_exposes_only_summary_fields(self):
        supplier = make_supplier()
        serializer = SupplierListSerializer(supplier)
        data = serializer.data
        expected_keys = {"id", "name", "email", "tax_id", "is_active"}
        self.assertEqual(set(data.keys()), expected_keys)

    def test_list_serializer_excludes_detail_fields(self):
        supplier = make_supplier()
        serializer = SupplierListSerializer(supplier)
        data = serializer.data
        for excluded in ["phone", "address", "city", "country", "contact_name",
                         "created_at", "updated_at"]:
            self.assertNotIn(excluded, data)


class SupplierDetailSerializerTests(TestCase):

    def test_detail_serializer_exposes_all_fields(self):
        supplier = make_supplier()
        serializer = SupplierDetailSerializer(supplier)
        data = serializer.data
        expected_keys = {
            "id", "name", "email", "phone", "address", "city", "country",
            "tax_id", "contact_name", "is_active", "created_at", "updated_at",
        }
        self.assertEqual(set(data.keys()), expected_keys)


# ---------------------------------------------------------------------------
# View / Endpoint Tests
# ---------------------------------------------------------------------------

class SupplierViewSetSetupMixin:
    """Mixin que provee usuario autenticado y proveedor de prueba."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="tester_supplier",
            password="SecurePass123!",
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )
        self.supplier = make_supplier()
        self.list_url = "/api/v1/suppliers/"
        self.detail_url = f"/api/v1/suppliers/{self.supplier.pk}/"

    def _post_data(self, **overrides):
        data = {
            "name": "Panasonic Colombia S.A.",
            "email": "panasonic@panasonic.com.co",
            "phone": "+57 601 555 0099",
            "address": "Av. El Dorado #92-32",
            "city": "Bogotá",
            "country": "Colombia",
            "tax_id": "900234567-4",
            "contact_name": "Javier Herrera",
        }
        data.update(overrides)
        return data


class SupplierViewSetHappyPathTests(SupplierViewSetSetupMixin, APITestCase):

    def test_list_returns_200(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(self.list_url)
        data = response.json()
        self.assertIn("count", data)
        self.assertIn("results", data)
        self.assertIn("next", data)
        self.assertIn("previous", data)

    def test_list_count_matches_active_suppliers(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.json()["count"], 1)

    def test_create_returns_201(self):
        response = self.client.post(self.list_url, self._post_data(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_persists_object_in_db(self):
        self.client.post(self.list_url, self._post_data(), format="json")
        self.assertTrue(
            Supplier.objects.filter(email="panasonic@panasonic.com.co").exists()
        )

    def test_retrieve_returns_200(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_supplier(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.json()["id"], self.supplier.pk)
        self.assertEqual(response.json()["name"], self.supplier.name)

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            self.detail_url, {"city": "Medellín"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_persists_change(self):
        self.client.patch(self.detail_url, {"city": "Cali"}, format="json")
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.city, "Cali")

    def test_full_update_returns_200(self):
        data = {
            "name": "Lenovo Colombia S.A.S.",
            "email": "proveedores@lenovo.com.co",
            "phone": "+57 601 555 1111",
            "address": "Cra 7 #100-10",
            "city": "Bogotá",
            "country": "Colombia",
            "tax_id": "900123456-1",
            "contact_name": "María López",
        }
        response = self.client.put(self.detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_returns_204(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_object_from_db(self):
        self.client.delete(self.detail_url)
        self.assertFalse(Supplier.objects.filter(pk=self.supplier.pk).exists())


class SupplierViewSetAuthTests(SupplierViewSetSetupMixin, APITestCase):

    def test_list_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.list_url, self._post_data(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.patch(self.detail_url, {"city": "Barranquilla"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_without_token_returns_401(self):
        self.client.credentials()
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token.invalido.aqui")
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierViewSetUnhappyPathTests(SupplierViewSetSetupMixin, APITestCase):

    def test_create_missing_name_returns_400(self):
        data = self._post_data()
        del data["name"]
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.json()["error"])

    def test_create_missing_email_returns_400(self):
        data = self._post_data()
        del data["email"]
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["error"])

    def test_create_missing_tax_id_returns_400(self):
        data = self._post_data()
        del data["tax_id"]
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tax_id", response.json()["error"])

    def test_create_invalid_email_format_returns_400(self):
        data = self._post_data(email="no-es-un-email")
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["error"])

    def test_create_duplicate_email_returns_400(self):
        data = self._post_data(email=self.supplier.email)
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["error"])

    def test_create_duplicate_tax_id_returns_400(self):
        data = self._post_data(tax_id=self.supplier.tax_id)
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tax_id", response.json()["error"])

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get("/api/v1/suppliers/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch("/api/v1/suppliers/99999/", {"city": "Cali"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete("/api/v1/suppliers/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SupplierViewSetEdgeCaseTests(SupplierViewSetSetupMixin, APITestCase):

    def test_inactive_supplier_not_in_list(self):
        inactive = Supplier.objects.create(
            name="Xerox Colombia",
            email="xerox@xerox.com.co",
            tax_id="700555444-3",
            is_active=False,
        )
        response = self.client.get(self.list_url)
        result_ids = [s["id"] for s in response.json()["results"]]
        self.assertNotIn(inactive.pk, result_ids)

    def test_inactive_supplier_is_accessible_by_retrieve(self):
        """
        El queryset filtra is_active=True, así que un proveedor inactivo
        no es accesible desde el endpoint de detalle.
        """
        inactive = Supplier.objects.create(
            name="Epson Colombia",
            email="epson@epson.com.co",
            tax_id="700444333-2",
            is_active=False,
        )
        response = self.client.get(f"/api/v1/suppliers/{inactive.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_serializer_has_fewer_fields_than_detail(self):
        list_response = self.client.get(self.list_url)
        list_fields = set(list_response.json()["results"][0].keys())

        detail_response = self.client.get(self.detail_url)
        detail_fields = set(detail_response.json().keys())

        self.assertLess(len(list_fields), len(detail_fields))
        # los campos del list deben ser subconjunto del detail
        self.assertTrue(list_fields.issubset(detail_fields))

    def test_list_uses_list_serializer_fields(self):
        response = self.client.get(self.list_url)
        result = response.json()["results"][0]
        expected_keys = {"id", "name", "email", "tax_id", "is_active"}
        self.assertEqual(set(result.keys()), expected_keys)

    def test_detail_uses_detail_serializer_fields(self):
        response = self.client.get(self.detail_url)
        data = response.json()
        expected_keys = {
            "id", "name", "email", "phone", "address", "city", "country",
            "tax_id", "contact_name", "is_active", "created_at", "updated_at",
        }
        self.assertEqual(set(data.keys()), expected_keys)

    def test_only_active_suppliers_count_in_pagination(self):
        # Crear uno inactivo — no debe contar
        Supplier.objects.create(
            name="Kodak Colombia",
            email="kodak@kodak.com.co",
            tax_id="600888777-6",
            is_active=False,
        )
        # Crear uno activo adicional
        Supplier.objects.create(
            name="Canon Colombia",
            email="canon@canon.com.co",
            tax_id="600999888-7",
            is_active=True,
        )
        response = self.client.get(self.list_url)
        # Solo deben aparecer los activos (el del setUp + el nuevo activo = 2)
        self.assertEqual(response.json()["count"], 2)

    def test_patch_contact_name_updates_correctly(self):
        response = self.client.patch(
            self.detail_url,
            {"contact_name": "Roberto Sánchez"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.contact_name, "Roberto Sánchez")

    def test_deactivate_supplier_via_patch(self):
        """Desactivar un proveedor vía PATCH lo elimina del queryset activo."""
        self.client.patch(self.detail_url, {"is_active": False}, format="json")
        # Ya no aparece en el list
        response = self.client.get(self.list_url)
        result_ids = [s["id"] for s in response.json()["results"]]
        self.assertNotIn(self.supplier.pk, result_ids)
