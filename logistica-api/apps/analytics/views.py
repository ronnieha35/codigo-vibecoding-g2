from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.shipments.models import Shipment, ShipmentStatus

STATUS_LABELS = {
    'PENDING': 'Pendiente',
    'ASSIGNED': 'Asignado',
    'IN_TRANSIT': 'En tránsito',
    'DELIVERED': 'Entregado',
    'CANCELLED': 'Cancelado',
}

LOW_STOCK_THRESHOLD = 10


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = now - timedelta(days=30)

        # KPI 1: active shipments (not terminal states)
        active_count = Shipment.objects.exclude(
            status__in=[ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED]
        ).count()

        # KPI 2: monthly revenue
        monthly_revenue = (
            Shipment.objects.filter(created_at__gte=month_start)
            .aggregate(total=Sum('shipping_cost'))['total']
            or 0
        )

        # KPI 3: delivery rate (last 30 days)
        recent_qs = Shipment.objects.filter(created_at__gte=thirty_days_ago)
        total_recent = recent_qs.count()
        delivered_recent = recent_qs.filter(status=ShipmentStatus.DELIVERED).count()
        delivery_rate = round(delivered_recent / total_recent * 100, 1) if total_recent else 0

        # KPI 4: low stock products
        low_stock_count = Product.objects.filter(
            stock_quantity__lt=LOW_STOCK_THRESHOLD,
            is_active=True,
        ).count()

        # Chart 5: by status (all time, or filtered by date)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        status_qs = Shipment.objects.all()
        if date_from:
            status_qs = status_qs.filter(created_at__date__gte=date_from)
        if date_to:
            status_qs = status_qs.filter(created_at__date__lte=date_to)

        by_status_raw = list(
            status_qs.values('status').annotate(count=Count('id')).order_by('status')
        )
        by_status = [
            {'status': row['status'], 'label': STATUS_LABELS.get(row['status'], row['status']), 'count': row['count']}
            for row in by_status_raw
        ]

        return Response({
            'kpis': {
                'active_shipments': active_count,
                'monthly_revenue': float(monthly_revenue),
                'delivery_rate': delivery_rate,
                'low_stock_count': low_stock_count,
            },
            'by_status': by_status,
        })


TRUNC_MAP = {'day': TruncDay, 'week': TruncWeek, 'month': TruncMonth}
DATE_FORMAT = {'day': '%Y-%m-%d', 'week': '%Y-%m-%d', 'month': '%Y-%m'}


class ShipmentTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        granularity = request.query_params.get('granularity', 'day')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        driver_id = request.query_params.get('driver_id')

        trunc_fn = TRUNC_MAP.get(granularity, TruncDay)
        fmt = DATE_FORMAT.get(granularity, '%Y-%m-%d')

        qs = Shipment.objects.all()
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if driver_id:
            qs = qs.filter(driver_id=driver_id)

        rows = (
            qs
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(
                count=Count('id'),
                revenue=Sum('shipping_cost'),
                weight=Sum('total_weight_kg'),
            )
            .order_by('period')
        )

        data = [
            {
                'period': row['period'].strftime(fmt),
                'count': row['count'],
                'revenue': round(float(row['revenue'] or 0), 2),
                'weight': round(float(row['weight'] or 0), 2),
            }
            for row in rows
            if row['period'] is not None
        ]

        return Response(data)


class TopDestinationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        country = request.query_params.get('country')
        limit = min(int(request.query_params.get('limit', 10)), 20)

        qs = Shipment.objects.exclude(destination_city='')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if country:
            qs = qs.filter(destination_country__iexact=country)

        rows = (
            qs.values('destination_city', 'destination_country')
            .annotate(count=Count('id'))
            .order_by('-count')[:limit]
        )

        return Response(list(rows))


class ShipmentsByDriverView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Shipment.objects.filter(driver__isnull=False)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        rows = (
            qs
            .values('driver__id', 'driver__first_name', 'driver__last_name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        data = [
            {
                'driver_id': r['driver__id'],
                'driver_name': f"{r['driver__first_name']} {r['driver__last_name']}",
                'count': r['count'],
            }
            for r in rows
        ]

        return Response(data)
