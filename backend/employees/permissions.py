from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrExecutiveReadOnly(BasePermission):
    """Admin: full CRUD. Executive: read-only. Nobody else can see employee records."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "admin":
            return True
        if request.user.role == "executive":
            return request.method in SAFE_METHODS
        return False