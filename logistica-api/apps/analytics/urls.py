from django.urls import path

from .views import DashboardSummaryView, ShipmentTimelineView, TopDestinationsView, ShipmentsByDriverView

urlpatterns = [
    path('analytics/dashboard/', DashboardSummaryView.as_view(), name='analytics-dashboard'),
    path('analytics/shipments/timeline/', ShipmentTimelineView.as_view(), name='analytics-timeline'),
    path('analytics/shipments/top-destinations/', TopDestinationsView.as_view(), name='analytics-top-destinations'),
    path('analytics/shipments/by-driver/', ShipmentsByDriverView.as_view(), name='analytics-by-driver'),
]
