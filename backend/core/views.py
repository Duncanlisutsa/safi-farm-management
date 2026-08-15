from datetime import date, timedelta

from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from tea.models import TeaHarvestLog
from pigs.models import Pig, PigVaccination, FeedRequest
from planner.models import Task
from crops.models import Crop
from factory.models import ProductionLog, SupplyOrder


class CanViewDashboard(IsAuthenticated):
    """Admin, executive, farm_manager only — per §4.1."""
    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view)
            and request.user.role in ("admin", "executive", "farm_manager")
        )


class DashboardView(APIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday of this week

        # Summary metrics
        tea_this_week = TeaHarvestLog.objects.filter(
            harvest_date__gte=week_start, harvest_date__lte=today
        ).aggregate(total=Sum("quantity_kg"))["total"] or 0

        total_pigs = Pig.objects.filter(status="active").count()
        active_tasks = Task.objects.filter(status__in=["scheduled", "in_progress"]).count()
        factory_lines_running = (
            ProductionLog.objects.filter(log_date=today)
            .values("production_line").distinct().count()
        )

        # Alerts
        vaccinations_overdue = list(
            PigVaccination.objects.filter(next_due_date__lt=today)
            .select_related("pig")
            .values("pig__tag_id", "vaccine_name", "next_due_date")
        )

        feed_pending_stale = FeedRequest.objects.filter(
            status="pending", created_at__lt=today - timedelta(days=2)
        ).count()

        orders_pending_stale = SupplyOrder.objects.filter(
            status="pending", created_at__lt=today - timedelta(days=2)
        ).count()

        crops_ready = list(
            Crop.objects.filter(expected_harvest_date__lte=today)
            .exclude(status="harvested")
            .values("id", "name", "plot_bed", "expected_harvest_date")
        )

        # Today's tasks
        todays_tasks = list(
            Task.objects.filter(
                week_start_date=week_start,
                day_of_week=today.strftime("%A").lower(),
            ).values("id", "title", "category", "status", "assigned_to__username")
        )

        return Response({
            "summary": {
                "tea_harvested_this_week_kg": tea_this_week,
                "total_active_pigs": total_pigs,
                "active_tasks": active_tasks,
                "factory_lines_running_today": factory_lines_running,
            },
            "alerts": {
                "vaccinations_overdue": vaccinations_overdue,
                "feed_requests_pending_over_2_days": feed_pending_stale,
                "supply_orders_pending_over_2_days": orders_pending_stale,
                "crops_ready_for_harvest": crops_ready,
            },
            "todays_tasks": todays_tasks,
        })