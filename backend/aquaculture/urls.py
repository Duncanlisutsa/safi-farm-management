from django.urls import path
from .views import PondListCreateView, PondDetailView, PondReportListCreateView

urlpatterns = [
    path("ponds/", PondListCreateView.as_view(), name="pond-list-create"),
    path("ponds/<int:pk>/", PondDetailView.as_view(), name="pond-detail"),
    path("pond-reports/", PondReportListCreateView.as_view(), name="pond-report-list-create"),
]