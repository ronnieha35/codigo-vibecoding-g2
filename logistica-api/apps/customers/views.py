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
    queryset = Customer.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerWriteSerializer
        return CustomerDetailSerializer
