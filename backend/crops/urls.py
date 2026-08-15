from django.urls import path
from .views import CropListCreateView, CropDetailView, ProduceReportListCreateView

urlpatterns = [
    path("crops/", CropListCreateView.as_view(), name="crop-list-create"),
    path("crops/<int:pk>/", CropDetailView.as_view(), name="crop-detail"),
    path("produce-reports/", ProduceReportListCreateView.as_view(), name="produce-report-list-create"),
]