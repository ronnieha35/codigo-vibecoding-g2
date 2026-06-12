from django.db.models import Q
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Route.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return RouteWriteSerializer
        return RouteDetailSerializer
