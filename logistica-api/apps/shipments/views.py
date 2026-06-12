from django.db.models import Q
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
            'driver',
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

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status = params.get('status')
        if status:
            qs = qs.filter(status=status)

        customer_id = params.get('customer_id')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        warehouse_id = params.get('warehouse_id')
        if warehouse_id:
            qs = qs.filter(origin_warehouse_id=warehouse_id)

        product_id = params.get('product_id')
        if product_id:
            qs = qs.filter(items__product_id=product_id).distinct()

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(scheduled_date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(scheduled_date__lte=date_to)

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(customer__name__icontains=search)
                | Q(destination_city__icontains=search)
                | Q(destination_country__icontains=search)
                | Q(destination_address__icontains=search)
            )

        return qs
