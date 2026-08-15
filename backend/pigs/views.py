from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pig, PigWeight, PigVaccination, PigActivityReport, FeedRequest, PigSale
from .serializers import (
    PigSerializer, PigWeightSerializer, PigVaccinationSerializer,
    PigActivityReportSerializer, FeedRequestSerializer,
    FeedRequestApprovalSerializer, PigSaleSerializer,
)
from .permissions import CanManagePigRecords, CanSubmitPigActivity, CanSubmitFeedRequest


class PigListCreateView(generics.ListCreateAPIView):
    queryset = Pig.objects.all()
    serializer_class = PigSerializer
    permission_classes = [CanManagePigRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "sex", "breed"]


class PigDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pig.objects.all()
    serializer_class = PigSerializer
    permission_classes = [CanManagePigRecords]


class PigWeightListCreateView(generics.ListCreateAPIView):
    queryset = PigWeight.objects.all()
    serializer_class = PigWeightSerializer
    permission_classes = [CanManagePigRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pig"]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class PigVaccinationListCreateView(generics.ListCreateAPIView):
    queryset = PigVaccination.objects.all()
    serializer_class = PigVaccinationSerializer
    permission_classes = [CanManagePigRecords]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pig"]


class PigActivityReportListCreateView(generics.ListCreateAPIView):
    serializer_class = PigActivityReportSerializer
    permission_classes = [CanSubmitPigActivity]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["activity_type", "report_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager", "executive"):
            return PigActivityReport.objects.all()
        return PigActivityReport.objects.filter(reported_by=user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class FeedRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedRequestSerializer
    permission_classes = [CanSubmitFeedRequest]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager"):
            return FeedRequest.objects.all()
        return FeedRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class FeedRequestDetailView(generics.RetrieveUpdateAPIView):
    queryset = FeedRequest.objects.all()
    permission_classes = [CanSubmitFeedRequest]

    def get_serializer_class(self):
        user = self.request.user
        if self.request.method == "PATCH" and user.role in ("admin", "farm_manager"):
            return FeedRequestApprovalSerializer
        return FeedRequestSerializer


class PigSaleListCreateView(generics.ListCreateAPIView):
    queryset = PigSale.objects.all()
    serializer_class = PigSaleSerializer
    permission_classes = [CanManagePigRecords]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)