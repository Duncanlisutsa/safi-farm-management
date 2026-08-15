from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsAdminOrExecutive(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "executive")
        )


class IsAdminOrFarmManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "farm_manager")
        )


class IsOwnerOrFarmManager(BasePermission):
    """Object-level: the assigned user themself, or the farm manager/admin."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("admin", "farm_manager"):
            return True
        # obj is expected to have an `assigned_to` or `reported_by` field
        owner_id = getattr(obj, "assigned_to_id", None) or getattr(obj, "reported_by_id", None)
        return owner_id == request.user.id


def IsSpecificRole(role_name):
    """Factory — returns a permission class scoped to one role."""
    class _IsSpecificRole(BasePermission):
        def has_permission(self, request, view):
            return bool(
                request.user and request.user.is_authenticated
                and request.user.role == role_name
            )
    return _IsSpecificRole