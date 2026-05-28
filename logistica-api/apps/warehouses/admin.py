from django.contrib import admin

from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'country', 'capacity_m3', 'is_active']
    list_filter = ['is_active', 'country']
    search_fields = ['name', 'city']
