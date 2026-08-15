from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManageTasks(BasePermission):
    """Admin/farm_manager can do anything. Everyone else can only view+update their own."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        # non-managers can list (their own tasks, filtered in the view) and can PATCH
        return request.method in SAFE_METHODS or request.method == "PATCH"

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("admin", "farm_manager"):
            return True
        return obj.assigned_to_id == request.user.id