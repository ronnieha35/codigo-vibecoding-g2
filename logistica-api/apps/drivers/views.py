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
    queryset = Driver.objects.select_related('user', 'transport').filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return DriverWriteSerializer
        return DriverDetailSerializer
