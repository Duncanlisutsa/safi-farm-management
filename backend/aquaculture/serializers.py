from rest_framework import serializers
from .models import Pond, PondReport


class PondSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pond
        fields = [
            "id", "name", "species", "stocking_date", "stocking_count",
            "feed_type", "target_harvest_date", "status",
        ]
        read_only_fields = ["id"]


class PondReportSerializer(serializers.ModelSerializer):
    pond_name = serializers.CharField(source="pond.name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = PondReport
        fields = [
            "id", "pond", "pond_name", "report_date", "activity_type",
            "quantity_value", "notes", "reported_by", "reported_by_name",
        ]
        read_only_fields = ["id", "reported_by"]