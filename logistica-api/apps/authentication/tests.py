from datetime import timedelta, timezone, datetime

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import aware_utcnow


TOKEN_URL = '/api/v1/auth/token/'
TOKEN_REFRESH_URL = '/api/v1/auth/token/refresh/'
TOKEN_VERIFY_URL = '/api/v1/auth/token/verify/'


class TokenObtainTests(APITestCase):
    """Tests para POST /api/v1/auth/token/ — obtener access + refresh token."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='carlos.mendoza',
            email='carlos.mendoza@logistica.com',
            password='Segura#2024!',
            first_name='Carlos',
            last_name='Mendoza',
        )
        self.valid_credentials = {
            'username': 'carlos.mendoza',
            'password': 'Segura#2024!',
        }

    # --- Happy path ---

    def test_obtain_token_with_valid_credentials_returns_200(self):
        """Credenciales válidas → 200 OK."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_obtain_token_response_contains_access_and_refresh(self):
        """Respuesta incluye los campos 'access' y 'refresh'."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_access_and_refresh_are_non_empty_strings(self):
        """Los tokens devueltos son strings no vacíos."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertIsInstance(response.data['access'], str)
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(len(response.data['refresh']) > 0)

    # --- Unhappy path ---

    def test_obtain_token_wrong_password_returns_401(self):
        """Password incorrecto → 401 Unauthorized."""
        data = {'username': 'carlos.mendoza', 'password': 'ContraseniaErronea99'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_nonexistent_username_returns_401(self):
        """Username que no existe → 401 Unauthorized."""
        data = {'username': 'usuario.fantasma', 'password': 'Segura#2024!'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_wrong_password_does_not_expose_tokens(self):
        """Respuesta de error no contiene tokens."""
        data = {'username': 'carlos.mendoza', 'password': 'ContraseniaErronea99'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)

    # --- Edge cases ---

    def test_obtain_token_empty_body_returns_400(self):
        """Body vacío {} → 400 Bad Request."""
        response = self.client.post(TOKEN_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_missing_password_returns_400(self):
        """Body sin campo 'password' → 400 Bad Request."""
        data = {'username': 'carlos.mendoza'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_missing_username_returns_400(self):
        """Body sin campo 'username' → 400 Bad Request."""
        data = {'password': 'Segura#2024!'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_missing_password_error_references_field(self):
        """El error 400 por campo faltante referencia el campo ausente.

        El custom_exception_handler envuelve los errores bajo la clave 'error',
        por lo que la estructura de respuesta es:
        {'error': {'password': [...]}, 'status_code': 400}
        """
        data = {'username': 'carlos.mendoza'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertIn('error', response.data)
        self.assertIn('password', response.data['error'])

    def test_obtain_token_missing_username_error_references_field(self):
        """El error 400 por campo faltante referencia el campo ausente.

        El custom_exception_handler envuelve los errores bajo la clave 'error',
        por lo que la estructura de respuesta es:
        {'error': {'username': [...]}, 'status_code': 400}
        """
        data = {'password': 'Segura#2024!'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertIn('error', response.data)
        self.assertIn('username', response.data['error'])

    def test_obtain_token_inactive_user_returns_401(self):
        """Usuario con is_active=False → 401 Unauthorized."""
        self.user.is_active = False
        self.user.save()
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenRefreshTests(APITestCase):
    """Tests para POST /api/v1/auth/token/refresh/ — refrescar access token."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ana.restrepo',
            email='ana.restrepo@logistica.com',
            password='Clave!Segura2024',
        )
        refresh = RefreshToken.for_user(self.user)
        self.valid_refresh_token = str(refresh)

    # --- Happy path ---

    def test_refresh_with_valid_token_returns_200(self):
        """Refresh token válido → 200 OK."""
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': self.valid_refresh_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_refresh_response_contains_access(self):
        """Respuesta incluye el campo 'access'."""
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': self.valid_refresh_token}, format='json'
        )
        self.assertIn('access', response.data)

    def test_refresh_returns_non_empty_access_token(self):
        """El nuevo access token es un string no vacío."""
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': self.valid_refresh_token}, format='json'
        )
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    # --- Unhappy path ---

    def test_refresh_with_invalid_token_returns_401(self):
        """Refresh token con valor inválido → 401 Unauthorized."""
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': 'token.invalido.completamente'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_with_random_string_returns_401(self):
        """String aleatorio como refresh token → 401 Unauthorized."""
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': 'abc123xyz'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_refresh_empty_body_returns_400(self):
        """Body vacío → 400 Bad Request."""
        response = self.client.post(TOKEN_REFRESH_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_missing_refresh_field_returns_400(self):
        """Body sin campo 'refresh' → 400 Bad Request."""
        response = self.client.post(TOKEN_REFRESH_URL, {'otro': 'valor'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_with_access_token_instead_of_refresh_returns_401(self):
        """Enviar access token en lugar de refresh token → 401 Unauthorized."""
        # Los access tokens tienen token_type='access', no 'refresh'
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        response = self.client.post(
            TOKEN_REFRESH_URL, {'refresh': access_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenVerifyTests(APITestCase):
    """Tests para POST /api/v1/auth/token/verify/ — verificar si un token es válido."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='jorge.vargas',
            email='jorge.vargas@techlogistica.co',
            password='Jorge$ecure2024',
        )
        refresh = RefreshToken.for_user(self.user)
        self.valid_access_token = str(refresh.access_token)
        self.valid_refresh_token = str(refresh)

    # --- Happy path ---

    def test_verify_valid_access_token_returns_200(self):
        """Access token válido → 200 OK."""
        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': self.valid_access_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_valid_refresh_token_returns_200(self):
        """Refresh token válido también pasa verificación → 200 OK."""
        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': self.valid_refresh_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_response_body_is_empty_on_success(self):
        """Verificación exitosa → body vacío (comportamiento de simplejwt)."""
        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': self.valid_access_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # simplejwt retorna {} en el body cuando el token es válido
        self.assertEqual(response.data, {})

    # --- Unhappy path ---

    def test_verify_invalid_token_returns_401(self):
        """Token con valor inválido → 401 Unauthorized."""
        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': 'token.completamente.invalido'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_random_string_returns_401(self):
        """String aleatorio como token → 401 Unauthorized."""
        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': 'noesunatoken123'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_verify_empty_body_returns_400(self):
        """Body vacío → 400 Bad Request."""
        response = self.client.post(TOKEN_VERIFY_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_missing_token_field_returns_400(self):
        """Body sin campo 'token' → 400 Bad Request."""
        response = self.client.post(TOKEN_VERIFY_URL, {'otro': 'valor'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_expired_token_returns_401(self):
        """Token con expiración en el pasado → 401 Unauthorized.

        Se genera un access token y se modifica directamente su campo 'exp'
        para que apunte a un instante ya transcurrido, simulando un token expirado.
        Importante: se trabaja sobre la instancia del token y se serializa al final,
        no se accede de nuevo a refresh.access_token (que crea una instancia nueva).
        """
        expired_user = User.objects.create_user(
            username='usuario.expirado',
            email='expirado@logistica.com',
            password='Expira#Ahora2024',
        )
        refresh = RefreshToken.for_user(expired_user)
        # Obtener la instancia del access token y modificar su expiración
        access_token = refresh.access_token
        access_token.set_exp(
            from_time=aware_utcnow() - timedelta(hours=2),
            lifetime=timedelta(seconds=1),
        )
        # Serializar la instancia ya modificada (no acceder de nuevo a refresh.access_token)
        expired_access = str(access_token)

        response = self.client.post(
            TOKEN_VERIFY_URL, {'token': expired_access}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
