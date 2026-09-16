from django.urls import path
from .views import HerbListCreateView, HerbDetailView, HerbHarvestLogListCreateView

urlpatterns = [
    path("herbs/", HerbListCreateView.as_view(), name="herb-list-create"),
    path("herbs/<int:pk>/", HerbDetailView.as_view(), name="herb-detail"),
    path("herb-harvest-logs/", HerbHarvestLogListCreateView.as_view(), name="herb-harvest-log-list-create"),
]