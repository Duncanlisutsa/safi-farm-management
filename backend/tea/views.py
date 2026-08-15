from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import TeaHarvestLog
from .serializers import TeaHarvestLogSerializer
from .permissions import CanManageTea


class TeaHarvestLogListCreateView(generics.ListCreateAPIView):
    queryset = TeaHarvestLog.objects.all()
    serializer_class = TeaHarvestLogSerializer
    permission_classes = [CanManageTea]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["week_number", "grade", "harvest_date"]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class TeaHarvestLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeaHarvestLog.objects.all()
    serializer_class = TeaHarvestLogSerializer
    permission_classes = [CanManageTea]