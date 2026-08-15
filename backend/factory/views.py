from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProductionLog, SupplyOrder
from .serializers import (
    ProductionLogSerializer, SupplyOrderSerializer, SupplyOrderApprovalSerializer
)
from .permissions import CanManageProduction, CanSubmitSupplyOrder


class ProductionLogListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionLogSerializer
    permission_classes = [CanManageProduction]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["production_line", "log_date", "batch_number"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "executive", "farm_manager"):
            return ProductionLog.objects.all()
        return ProductionLog.objects.filter(logged_by=user)

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)


class ProductionLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductionLog.objects.all()
    serializer_class = ProductionLogSerializer
    permission_classes = [CanManageProduction]


class SupplyOrderListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplyOrderSerializer
    permission_classes = [CanSubmitSupplyOrder]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "urgency"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager"):
            return SupplyOrder.objects.all()
        return SupplyOrder.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class SupplyOrderDetailView(generics.RetrieveUpdateAPIView):
    queryset = SupplyOrder.objects.all()
    permission_classes = [CanSubmitSupplyOrder]

    def get_serializer_class(self):
        if self.request.method == "PATCH" and self.request.user.role in ("admin", "farm_manager"):
            return SupplyOrderApprovalSerializer
        return SupplyOrderSerializer