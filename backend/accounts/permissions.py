from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrFarmManagerReadOnly(BasePermission):
    """Admin: full CRUD. Farm manager: read-only (needs to list staff for task assignment)."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "admin":
            return True
        if request.user.role == "farm_manager":
            return request.method in SAFE_METHODS
        return False