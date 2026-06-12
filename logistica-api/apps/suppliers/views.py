from django.db.models import Q
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Supplier.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(city__icontains=search))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SupplierWriteSerializer
        return SupplierDetailSerializer
