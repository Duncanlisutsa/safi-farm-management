from rest_framework import serializers
from .models import ProductionLog, SupplyOrder


class ProductionLogSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source="logged_by.username", read_only=True)

    class Meta:
        model = ProductionLog
        fields = [
            "id", "production_line", "log_date", "batch_number",
            "input_description", "input_quantity_kg", "output_description",
            "output_quantity", "output_unit", "notes", "logged_by", "logged_by_name",
        ]
        read_only_fields = ["id", "logged_by"]


class SupplyOrderSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.username", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = SupplyOrder
        fields = [
            "id", "requested_by", "requested_by_name", "item_name",
            "quantity_description", "urgency", "reason", "status",
            "approved_by", "approved_by_name", "created_at",
        ]
        read_only_fields = ["id", "requested_by", "status", "approved_by", "created_at"]


class SupplyOrderApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyOrder
        fields = ["status"]