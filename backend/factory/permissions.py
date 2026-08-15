from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanManageProduction(BasePermission):
    """Factory worker: full log-only (create+view own). Admin: full. Exec/farm_manager: read-only."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "admin":
            return True
        if request.user.role in ("executive", "farm_manager"):
            return request.method in SAFE_METHODS
        if request.user.role == "factory_worker":
            return request.method in SAFE_METHODS or request.method == "POST"
        return False


class CanSubmitSupplyOrder(BasePermission):
    """Any farm attendant role can submit an order for their own department;
    farm_manager approves/rejects."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("admin", "farm_manager"):
            return True
        attendant_roles = ("farm_attendant", "pig_attendant", "fish_attendant", "factory_worker")
        if request.user.role in attendant_roles:
            return request.method in SAFE_METHODS or request.method == "POST"
        return False