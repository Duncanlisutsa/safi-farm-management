from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManagePigRecords(BasePermission):
    """Admin/farm_manager: full CRUD on pig profiles, weights, vaccinations, sales. Executive: read-only."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role == "executive":
            return request.method in SAFE_METHODS
        return False


class CanSubmitPigActivity(BasePermission):
    """Pig attendant submits activity reports; managers/execs can view."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager", "executive"):
            return True
        if request.user.role == "pig_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False


class CanSubmitFeedRequest(BasePermission):
    """Pig attendant creates + views own; farm_manager/admin can view all and approve."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role == "pig_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False