from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'sku', 'category', 'supplier', 'stock_quantity', 'is_active']
    list_filter = ['is_active', 'category', 'supplier']
    search_fields = ['name', 'sku']
