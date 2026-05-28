from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Customer(BaseModel):
    class CustomerType(models.TextChoices):
        PERSON = 'PERSON', 'Persona'
        COMPANY = 'COMPANY', 'Empresa'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers',
    )
    name = models.CharField(max_length=200)
    customer_type = models.CharField(max_length=10, choices=CustomerType.choices)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'customers_customer'

    def __str__(self):
        return self.name
