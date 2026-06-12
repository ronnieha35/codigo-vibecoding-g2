from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Customer
from .serializers import (
    CustomerDetailSerializer,
    CustomerListSerializer,
    CustomerWriteSerializer,
)


@viewset_tag('customers')
class CustomerViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Customer.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        customer_type = self.request.query_params.get('customer_type', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(city__icontains=search))
        if customer_type:
            qs = qs.filter(customer_type=customer_type)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerWriteSerializer
        return CustomerDetailSerializer
