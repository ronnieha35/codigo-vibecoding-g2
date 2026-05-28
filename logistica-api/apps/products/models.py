from django.db import models

from apps.core.models import BaseModel


class Product(BaseModel):
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.CASCADE,
        related_name='products',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    width_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'products_product'

    def __str__(self):
        return f'{self.name} ({self.sku})'
