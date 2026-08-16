from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import PoultryBatch, PoultryActivityReport, EggCollectionLog, PoultryFeedLog
from .serializers import (
    PoultryBatchSerializer, PoultryActivityReportSerializer,
    EggCollectionLogSerializer, PoultryFeedLogSerializer,
)
from .permissions import CanManagePoultry, CanSubmitPoultryRecords


class PoultryBatchListCreateView(generics.ListCreateAPIView):
    queryset = PoultryBatch.objects.all()
    serializer_class = PoultryBatchSerializer
    permission_classes = [CanManagePoultry]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["species", "status", "is_layer"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PoultryBatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PoultryBatch.objects.all()
    serializer_class = PoultryBatchSerializer
    permission_classes = [CanManagePoultry]


class PoultryActivityReportListCreateView(generics.ListCreateAPIView):
    serializer_class = PoultryActivityReportSerializer
    permission_classes = [CanSubmitPoultryRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["batch", "activity_type", "report_date"]

    def get_queryset(self):
        return PoultryActivityReport.objects.all()

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class EggCollectionLogListCreateView(generics.ListCreateAPIView):
    serializer_class = EggCollectionLogSerializer
    permission_classes = [CanSubmitPoultryRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["batch", "collection_date"]

    def get_queryset(self):
        return EggCollectionLog.objects.all()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class PoultryFeedLogListCreateView(generics.ListCreateAPIView):
    serializer_class = PoultryFeedLogSerializer
    permission_classes = [CanSubmitPoultryRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["batch", "feed_date"]

    def get_queryset(self):
        return PoultryFeedLog.objects.all()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)