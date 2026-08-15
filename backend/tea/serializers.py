from rest_framework import serializers
from .models import TeaHarvestLog


class TeaHarvestLogSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = TeaHarvestLog
        fields = [
            "id", "week_number", "harvest_date", "quantity_kg", "grade",
            "plots_harvested", "reported_by", "reported_by_name", "notes", "created_at",
        ]
        read_only_fields = ["id", "reported_by", "created_at"]