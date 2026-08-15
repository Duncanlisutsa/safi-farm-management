from django.urls import path
from .views import (
    PigListCreateView, PigDetailView, PigWeightListCreateView,
    PigVaccinationListCreateView, PigActivityReportListCreateView,
    FeedRequestListCreateView, FeedRequestDetailView, PigSaleListCreateView,
)

urlpatterns = [
    path("pigs/", PigListCreateView.as_view(), name="pig-list-create"),
    path("pigs/<int:pk>/", PigDetailView.as_view(), name="pig-detail"),
    path("pig-weights/", PigWeightListCreateView.as_view(), name="pig-weight-list-create"),
    path("pig-vaccinations/", PigVaccinationListCreateView.as_view(), name="pig-vaccination-list-create"),
    path("pig-reports/", PigActivityReportListCreateView.as_view(), name="pig-report-list-create"),
    path("feed-requests/", FeedRequestListCreateView.as_view(), name="feed-request-list-create"),
    path("feed-requests/<int:pk>/", FeedRequestDetailView.as_view(), name="feed-request-detail"),
    path("pig-sales/", PigSaleListCreateView.as_view(), name="pig-sale-list-create"),
]