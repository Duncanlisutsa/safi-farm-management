from rest_framework.permissions import BasePermission


class CanViewReports(BasePermission):
    """Admin, executive, farm_manager only — per §3.2 Production Reports row."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "executive", "farm_manager")
        )