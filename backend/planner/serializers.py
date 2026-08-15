from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.username", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "assigned_to", "assigned_to_name",
            "assigned_by", "assigned_by_name", "category",
            "week_start_date", "day_of_week", "status", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "assigned_by", "created_at", "updated_at"]


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Narrow serializer for staff updating just their own task's status."""
    class Meta:
        model = Task
        fields = ["status"]