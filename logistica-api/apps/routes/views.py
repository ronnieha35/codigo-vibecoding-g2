from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.schema import viewset_tag

from .models import Route
from .serializers import (
    RouteDetailSerializer,
    RouteListSerializer,
    RouteWriteSerializer,
)


@viewset_tag('routes')
class RouteViewSet(ModelViewSet):
    queryset = (
        Route.objects
        .select_related('origin_warehouse')
        .prefetch_related('stops__warehouse')
        .filter(is_active=True)
    )
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return RouteWriteSerializer
        return RouteDetailSerializer
