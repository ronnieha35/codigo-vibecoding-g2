from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Shipment
from .serializers import (
    ShipmentDetailSerializer,
    ShipmentListSerializer,
    ShipmentWriteSerializer,
)


@viewset_tag('shipments')
class ShipmentViewSet(ModelViewSet):
    queryset = (
        Shipment.objects
        .select_related(
            'customer',
            'origin_warehouse',
            'driver__user',
            'transport',
            'route',
        )
        .prefetch_related(
            'items__product',
            'status_history__changed_by',
        )
        .all()
    )
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ShipmentWriteSerializer
        return ShipmentDetailSerializer
