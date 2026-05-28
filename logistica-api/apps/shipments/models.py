from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class ShipmentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pendiente'
    ASSIGNED = 'ASSIGNED', 'Asignado'
    IN_TRANSIT = 'IN_TRANSIT', 'En tránsito'
    DELIVERED = 'DELIVERED', 'Entregado'
    CANCELLED = 'CANCELLED', 'Cancelado'


class Shipment(BaseModel):
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='shipments',
    )
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    transport = models.ForeignKey(
        'transport.Transport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100, blank=True)
    destination_country = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=15,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PENDING,
    )
    scheduled_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'shipments_shipment'
        ordering = ['-created_at']

    def __str__(self):
        return f'Shipment #{self.pk} — {self.customer} ({self.status})'


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='shipment_items',
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'shipments_shipmentitem'

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'


class ShipmentStatusHistory(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    status = models.CharField(max_length=15, choices=ShipmentStatus.choices)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipment_status_changes',
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'shipments_shipmentstatushistory'
        ordering = ['changed_at']

    def __str__(self):
        return f'Shipment #{self.shipment_id} → {self.status}'
