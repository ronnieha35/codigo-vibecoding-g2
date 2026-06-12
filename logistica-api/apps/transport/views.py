from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Transport
from .serializers import (
    TransportDetailSerializer,
    TransportListSerializer,
    TransportWriteSerializer,
)


@viewset_tag('transport')
class TransportViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transport.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        vehicle_type = self.request.query_params.get('vehicle_type', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(license_plate__icontains=search))
        if vehicle_type:
            qs = qs.filter(vehicle_type=vehicle_type)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TransportListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return TransportWriteSerializer
        return TransportDetailSerializer
