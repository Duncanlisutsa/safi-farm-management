from django.urls import path
from .views import TeaHarvestLogListCreateView, TeaHarvestLogDetailView

urlpatterns = [
    path("tea-logs/", TeaHarvestLogListCreateView.as_view(), name="tea-log-list-create"),
    path("tea-logs/<int:pk>/", TeaHarvestLogDetailView.as_view(), name="tea-log-detail"),
]