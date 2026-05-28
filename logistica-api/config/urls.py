"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Documentación
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/auth/token/', extend_schema(tags=['auth'])(TokenObtainPairView).as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', extend_schema(tags=['auth'])(TokenRefreshView).as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', extend_schema(tags=['auth'])(TokenVerifyView).as_view(), name='token_verify'),
    path('api/v1/', include('apps.suppliers.urls')),
    path('api/v1/', include('apps.warehouses.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.transport.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    path('api/v1/', include('apps.routes.urls')),
    path('api/v1/', include('apps.shipments.urls')),
]
