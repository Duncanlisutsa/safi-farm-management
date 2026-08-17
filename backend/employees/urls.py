from django.urls import path
from .views import EmployeeProfileListCreateView, EmployeeProfileDetailView

urlpatterns = [
    path("employee-profiles/", EmployeeProfileListCreateView.as_view(), name="employee-profile-list-create"),
    path("employee-profiles/<int:pk>/", EmployeeProfileDetailView.as_view(), name="employee-profile-detail"),
]