from rest_framework import serializers
from .models import Herb, HerbHarvestLog


class HerbSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Herb
        fields = [
            "id", "name", "herb_type", "variety", "part_used", "use_category",
            "preparation_notes", "drying_method", "harvest_type", "plot_bed",
            "planting_date", "expected_harvest_date", "actual_harvest_date",
            "status", "photo", "notes", "created_by", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class HerbHarvestLogSerializer(serializers.ModelSerializer):
    herb_name = serializers.CharField(source="herb.name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = HerbHarvestLog
        fields = [
            "id", "herb", "herb_name", "reported_by", "reported_by_name",
            "harvest_date", "quantity", "unit", "part_harvested", "drying_method",
            "plot_bed", "notes", "created_at",
        ]
        read_only_fields = ["id", "reported_by", "created_at"]