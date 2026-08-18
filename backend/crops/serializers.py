from rest_framework import serializers
from .models import Crop, ProduceReport


class CropSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Crop
        fields = [
            "id", "name", "crop_type", "variety", "uses", "plot_bed",
            "planting_date", "expected_harvest_date", "actual_harvest_date",
            "status", "photo", "notes", "created_by", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class ProduceReportSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source="crop.name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = ProduceReport
        fields = [
            "id", "crop", "crop_name", "reported_by", "reported_by_name",
            "report_date", "quantity", "unit", "plot_bed", "notes", "created_at",
        ]
        read_only_fields = ["id", "reported_by", "created_at"]