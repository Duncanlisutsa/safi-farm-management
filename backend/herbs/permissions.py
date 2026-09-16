from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManageHerbs(BasePermission):
    """Admin/farm_manager: full CRUD. Executive: read-only. Farm attendant: read-only on herbs."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role in ("executive", "farm_attendant"):
            return request.method in SAFE_METHODS
        return False


class CanSubmitHerbHarvest(BasePermission):
    """Farm attendant submits; admin/farm_manager/executive can view."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager", "executive"):
            return True
        if request.user.role == "farm_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False