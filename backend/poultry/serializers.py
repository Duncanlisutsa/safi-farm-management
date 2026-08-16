from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import PoultryBatch, PoultryActivityReport, EggCollectionLog, PoultryFeedLog


class PoultryBatchSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = PoultryBatch
        fields = [
            "id", "batch_name", "species", "breed", "gender", "count",
            "average_size_kg", "is_layer", "date_of_birth", "acquisition_date",
            "status", "notes", "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class PoultryActivityReportSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source="batch.batch_name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = PoultryActivityReport
        fields = [
            "id", "batch", "batch_name", "report_date", "activity_type",
            "count_affected", "details", "reported_by", "reported_by_name",
        ]
        read_only_fields = ["id", "reported_by"]


class EggCollectionLogSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source="batch.batch_name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.username", read_only=True)

    class Meta:
        model = EggCollectionLog
        fields = [
            "id", "batch", "batch_name", "collection_date", "eggs_collected",
            "broken_eggs", "notes", "recorded_by", "recorded_by_name",
        ]
        read_only_fields = ["id", "recorded_by"]

    def validate(self, data):
        batch = data.get("batch") or getattr(self.instance, "batch", None)
        if batch and batch.species != PoultryBatch.Species.CHICKEN:
            raise serializers.ValidationError("Egg collection logs can only be recorded for chicken batches.")
        return data


class PoultryFeedLogSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source="batch.batch_name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.username", read_only=True)

    class Meta:
        model = PoultryFeedLog
        fields = [
            "id", "batch", "batch_name", "feed_date", "feed_type",
            "quantity_kg", "notes", "recorded_by", "recorded_by_name",
        ]
        read_only_fields = ["id", "recorded_by"]

    def validate(self, data):
        batch = data.get("batch") or getattr(self.instance, "batch", None)
        if batch and batch.species != PoultryBatch.Species.CHICKEN:
            raise serializers.ValidationError("Feed logs are currently restricted to chicken batches.")
        return data