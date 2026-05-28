from django.db import models

from apps.core.models import BaseModel


class Transport(BaseModel):
    class VehicleType(models.TextChoices):
        TRUCK = 'TRUCK', 'Camión'
        VAN = 'VAN', 'Furgoneta'
        MOTORCYCLE = 'MOTORCYCLE', 'Motocicleta'
        OTHER = 'OTHER', 'Otro'

    name = models.CharField(max_length=200)
    license_plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=15, choices=VehicleType.choices)
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    capacity_m3 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'transport_transport'

    def __str__(self):
        return f'{self.name} ({self.license_plate})'
