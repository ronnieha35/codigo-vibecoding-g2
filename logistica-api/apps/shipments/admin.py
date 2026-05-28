from django.contrib import admin

from .models import Shipment, ShipmentItem, ShipmentStatusHistory


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 1


class ShipmentStatusHistoryInline(admin.TabularInline):
    model = ShipmentStatusHistory
    extra = 0
    readonly_fields = ['status', 'changed_at', 'changed_by', 'notes']
    can_delete = False


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'customer', 'status', 'scheduled_date',
        'destination_city', 'shipping_cost', 'created_at',
    ]
    list_filter = ['status']
    search_fields = ['customer__name', 'destination_city', 'destination_address']
    inlines = [ShipmentItemInline, ShipmentStatusHistoryInline]
