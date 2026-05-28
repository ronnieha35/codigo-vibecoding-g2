from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Warehouse
from .serializers import (
    WarehouseDetailSerializer,
    WarehouseListSerializer,
    WarehouseWriteSerializer,
)


@viewset_tag('warehouses')
class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return WarehouseWriteSerializer
        return WarehouseDetailSerializer
