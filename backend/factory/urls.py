from django.urls import path
from .views import (
    ProductionLogListCreateView, ProductionLogDetailView,
    SupplyOrderListCreateView, SupplyOrderDetailView,
)

urlpatterns = [
    path("production-logs/", ProductionLogListCreateView.as_view(), name="production-log-list-create"),
    path("production-logs/<int:pk>/", ProductionLogDetailView.as_view(), name="production-log-detail"),
    path("orders/", SupplyOrderListCreateView.as_view(), name="supply-order-list-create"),
    path("orders/<int:pk>/", SupplyOrderDetailView.as_view(), name="supply-order-detail"),
]