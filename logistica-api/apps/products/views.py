from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Product
from .serializers import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)


@viewset_tag('products')
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related('supplier', 'warehouse').filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductDetailSerializer
