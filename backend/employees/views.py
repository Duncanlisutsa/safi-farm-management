from rest_framework import generics
from .models import EmployeeProfile
from .serializers import EmployeeProfileSerializer
from .permissions import IsAdminOrExecutiveReadOnly


class EmployeeProfileListCreateView(generics.ListCreateAPIView):
    queryset = EmployeeProfile.objects.select_related("user").all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAdminOrExecutiveReadOnly]


class EmployeeProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EmployeeProfile.objects.select_related("user").all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAdminOrExecutiveReadOnly]