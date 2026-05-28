from django.contrib import admin

from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'license_number', 'transport', 'is_available', 'is_active']
    list_filter = ['is_active', 'is_available']
    search_fields = ['license_number', 'user__username', 'user__first_name']
