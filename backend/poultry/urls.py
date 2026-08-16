from django.urls import path
from .views import (
    PoultryBatchListCreateView, PoultryBatchDetailView,
    PoultryActivityReportListCreateView, EggCollectionLogListCreateView,
    PoultryFeedLogListCreateView,
)

urlpatterns = [
    path("poultry-batches/", PoultryBatchListCreateView.as_view(), name="poultry-batch-list-create"),
    path("poultry-batches/<int:pk>/", PoultryBatchDetailView.as_view(), name="poultry-batch-detail"),
    path("poultry-reports/", PoultryActivityReportListCreateView.as_view(), name="poultry-report-list-create"),
    path("egg-logs/", EggCollectionLogListCreateView.as_view(), name="egg-log-list-create"),
    path("poultry-feed-logs/", PoultryFeedLogListCreateView.as_view(), name="poultry-feed-log-list-create"),
]