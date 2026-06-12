from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Driver
from .serializers import (
    DriverDetailSerializer,
    DriverListSerializer,
    DriverWriteSerializer,
)


@viewset_tag('drivers')
class DriverViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Driver.objects.select_related('transport').filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(license_number__icontains=search))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return DriverWriteSerializer
        return DriverDetailSerializer
