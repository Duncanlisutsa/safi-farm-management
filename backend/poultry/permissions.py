from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManagePoultry(BasePermission):
    """Admin/farm_manager: full CRUD. Executive: read-only. Farm attendant: read-only on batches."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        if request.user.role in ("executive", "farm_attendant"):
            return request.method in SAFE_METHODS
        return False


class CanSubmitPoultryRecords(BasePermission):
    """Farm attendant submits activity/egg/feed logs; managers/execs view."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager", "executive"):
            return True
        if request.user.role == "farm_attendant":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False