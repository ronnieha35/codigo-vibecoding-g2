from django.contrib import admin

from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1
    ordering = ['stop_order']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'origin_warehouse', 'estimated_duration_hours', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    inlines = [RouteStopInline]
