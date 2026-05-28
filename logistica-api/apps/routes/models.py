from django.db import models

from apps.core.models import BaseModel


class Route(BaseModel):
    name = models.CharField(max_length=200)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='routes',
    )
    description = models.TextField(blank=True)
    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'routes_route'

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='route_stops',
    )
    stop_order = models.PositiveSmallIntegerField()
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'routes_routestop'
        constraints = [
            models.UniqueConstraint(
                fields=['route', 'stop_order'],
                name='unique_route_stop_order',
            )
        ]
        ordering = ['stop_order']

    def __str__(self):
        return f'{self.route.name} — parada {self.stop_order}'
