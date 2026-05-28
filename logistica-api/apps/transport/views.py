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
    queryset = Transport.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TransportListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return TransportWriteSerializer
        return TransportDetailSerializer
