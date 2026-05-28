from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'customer_type', 'email', 'city', 'is_active']
    list_filter = ['is_active', 'customer_type', 'country']
    search_fields = ['name', 'email', 'tax_id']
