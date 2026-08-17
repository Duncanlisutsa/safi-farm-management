from rest_framework import serializers
from .models import EmployeeProfile


class EmployeeProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.CharField(source="user.role", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            "id", "user", "username", "full_name", "role", "email",
            "phone_number", "bank_account_number", "kra_pin",
            "id_document", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username