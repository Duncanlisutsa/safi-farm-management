from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManagePonds(BasePermission):
    """Admin/farm_manager: full CRUD. Executive: read-only."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role == "executive":
            return request.method in SAFE_METHODS
        return False


class CanSubmitPondReport(BasePermission):
    """Fish attendant submits; managers/execs view."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager", "executive"):
            return True
        if request.user.role == "fish_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False