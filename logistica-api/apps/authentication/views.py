from django.contrib.auth.models import User, Group, Permission
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    GroupSerializer,
    GroupWriteSerializer,
    PermissionSerializer,
    UserListSerializer,
    UserMeSerializer,
    UserMeWriteSerializer,
    UserWriteSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserMeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UserMeWriteSerializer
        return UserMeSerializer


class UserViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = User.objects.prefetch_related('groups').all().order_by('id')
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ('create', 'partial_update'):
            return UserWriteSerializer
        return UserListSerializer


class GroupViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = Group.objects.prefetch_related('permissions__content_type').all().order_by('name')
    pagination_class = None
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ('create', 'partial_update'):
            return GroupWriteSerializer
        return GroupSerializer


class PermissionViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = Permission.objects.select_related('content_type').filter(
        content_type__app_label__in=[
            'customers', 'shipments', 'products', 'transport',
            'drivers', 'routes', 'warehouses', 'suppliers',
        ]
    ).order_by('content_type__app_label', 'codename')
    serializer_class = PermissionSerializer
    pagination_class = None
