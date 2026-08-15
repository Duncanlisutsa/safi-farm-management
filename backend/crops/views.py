from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Crop, ProduceReport
from .serializers import CropSerializer, ProduceReportSerializer
from .permissions import CanManageCrops, CanSubmitProduceReport


class CropListCreateView(generics.ListCreateAPIView):
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [CanManageCrops]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["crop_type", "status", "plot_bed"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CropDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [CanManageCrops]


class ProduceReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ProduceReportSerializer
    permission_classes = [CanSubmitProduceReport]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["crop", "report_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager", "executive"):
            return ProduceReport.objects.all()
        return ProduceReport.objects.filter(reported_by=user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)