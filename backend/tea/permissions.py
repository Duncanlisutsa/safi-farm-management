from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManageTea(BasePermission):
    """Admin/farm_manager: full CRUD. Executive: read-only. Farm attendant: can submit logs."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role == "executive":
            return request.method in SAFE_METHODS
        if request.user.role == "farm_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False