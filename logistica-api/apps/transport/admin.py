from django.contrib import admin

from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'license_plate', 'vehicle_type', 'is_available', 'is_active']
    list_filter = ['is_active', 'vehicle_type', 'is_available']
    search_fields = ['name', 'license_plate']
