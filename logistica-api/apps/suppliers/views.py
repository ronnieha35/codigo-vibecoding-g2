from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Supplier
from .serializers import (
    SupplierDetailSerializer,
    SupplierListSerializer,
    SupplierWriteSerializer,
)


@viewset_tag('suppliers')
class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SupplierWriteSerializer
        return SupplierDetailSerializer
