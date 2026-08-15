from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task
from .serializers import TaskSerializer, TaskStatusUpdateSerializer
from .permissions import CanManageTasks


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [CanManageTasks]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["assigned_to", "category", "status", "week_start_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "farm_manager"):
            return Task.objects.all()
        return Task.objects.filter(assigned_to=user)

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    permission_classes = [CanManageTasks]

    def get_serializer_class(self):
        user = self.request.user
        if self.request.method == "PATCH" and user.role not in ("admin", "farm_manager"):
            return TaskStatusUpdateSerializer
        return TaskSerializer