from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pond, PondReport
from .serializers import PondSerializer, PondReportSerializer
from .permissions import CanManagePonds, CanSubmitPondReport


class PondListCreateView(generics.ListCreateAPIView):
    queryset = Pond.objects.all()
    serializer_class = PondSerializer
    permission_classes = [CanManagePonds]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "species"]


class PondDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pond.objects.all()
    serializer_class = PondSerializer
    permission_classes = [CanManagePonds]


class PondReportListCreateView(generics.ListCreateAPIView):
    serializer_class = PondReportSerializer
    permission_classes = [CanSubmitPondReport]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pond", "activity_type", "report_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager", "executive"):
            return PondReport.objects.all()
        return PondReport.objects.filter(reported_by=user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)