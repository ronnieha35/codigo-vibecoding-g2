from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'tax_id', 'is_active', 'created_at']
    list_filter = ['is_active', 'country']
    search_fields = ['name', 'email', 'tax_id']
