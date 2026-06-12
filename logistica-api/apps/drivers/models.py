from django.db import models

from apps.core.models import BaseModel


class Driver(BaseModel):
    first_name = models.CharField(max_length=150, default='')
    last_name = models.CharField(max_length=150, default='')
    transport = models.ForeignKey(
        'transport.Transport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='drivers',
    )
    license_number = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'drivers_driver'

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.license_number})'
