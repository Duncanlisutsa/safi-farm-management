from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrFarmManagerFull(BasePermission):
    """Admin: full CRUD on any account, including deleting/deactivating.
    Farm manager: can list, create, and update user credentials (including
    passwords) — but cannot delete accounts, and cannot edit admin or other
    farm_manager accounts (avoids privilege escalation)."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "admin":
            return True
        if request.user.role == "farm_manager":
            return request.method != "DELETE"
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        if request.user.role == "farm_manager":
            if request.method == "DELETE":
                return False
            if obj.id == request.user.id:
                return True
            return obj.role not in ("admin", "farm_manager")
        return False