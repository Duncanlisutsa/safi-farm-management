from rest_framework import serializers
from .models import Pig, PigWeight, PigVaccination, PigActivityReport, FeedRequest, PigSale


class PigWeightSerializer(serializers.ModelSerializer):
    class Meta:
        model = PigWeight
        fields = ["id", "pig", "weigh_date", "weight_kg", "recorded_by"]
        read_only_fields = ["id", "recorded_by"]


class PigVaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PigVaccination
        fields = ["id", "pig", "vaccine_name", "date_given", "next_due_date", "administered_by"]
        read_only_fields = ["id"]


class PigSerializer(serializers.ModelSerializer):
    weights = PigWeightSerializer(many=True, read_only=True)
    vaccinations = PigVaccinationSerializer(many=True, read_only=True)

    class Meta:
        model = Pig
        fields = [
            "id", "tag_id", "breed", "sex", "dob", "acquisition_date",
            "status", "notes", "weights", "vaccinations", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PigActivityReportSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = PigActivityReport
        fields = [
            "id", "pig_reference", "report_date", "activity_type",
            "details", "reported_by", "reported_by_name",
        ]
        read_only_fields = ["id", "reported_by"]


class FeedRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.username", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = FeedRequest
        fields = [
            "id", "requested_by", "requested_by_name", "feed_type", "quantity_kg",
            "required_by_date", "reason", "status", "approved_by", "approved_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "requested_by", "status", "approved_by", "created_at"]


class FeedRequestApprovalSerializer(serializers.ModelSerializer):
    """Narrow serializer — farm manager can only change status via this one."""
    class Meta:
        model = FeedRequest
        fields = ["status"]


class PigSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PigSale
        fields = [
            "id", "pig", "sale_date", "buyer_name", "weight_at_sale_kg",
            "price_per_kg", "total_amount", "recorded_by",
        ]
        read_only_fields = ["id", "recorded_by"]