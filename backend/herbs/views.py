from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Herb, HerbHarvestLog
from .serializers import HerbSerializer, HerbHarvestLogSerializer
from .permissions import CanManageHerbs, CanSubmitHerbHarvest


class HerbListCreateView(generics.ListCreateAPIView):
    queryset = Herb.objects.all()
    serializer_class = HerbSerializer
    permission_classes = [CanManageHerbs]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["herb_type", "status", "plot_bed", "harvest_type"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class HerbDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Herb.objects.all()
    serializer_class = HerbSerializer
    permission_classes = [CanManageHerbs]


class HerbHarvestLogListCreateView(generics.ListCreateAPIView):
    serializer_class = HerbHarvestLogSerializer
    permission_classes = [CanSubmitHerbHarvest]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["herb", "harvest_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager", "executive"):
            return HerbHarvestLog.objects.all()
        return HerbHarvestLog.objects.filter(reported_by=user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)