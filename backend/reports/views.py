from datetime import date, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils.dateparse import parse_date

from crops.models import ProduceReport
from tea.models import TeaHarvestLog
from pigs.models import Pig, PigActivityReport, PigSale, FeedRequest
from aquaculture.models import Pond, PondReport
from factory.models import ProductionLog

from .permissions import CanViewReports


def _date_range(request):
    """Shared helper: reads ?start=YYYY-MM-DD&end=YYYY-MM-DD from query params,
    defaults to the last 30 days if not given."""
    start = parse_date(request.query_params.get("start", "")) or (date.today() - timedelta(days=30))
    end = parse_date(request.query_params.get("end", "")) or date.today()
    return start, end


class TeaReportView(APIView):
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)
        logs = TeaHarvestLog.objects.filter(harvest_date__range=(start, end))

        total_kg = logs.aggregate(total=Sum("quantity_kg"))["total"] or 0
        by_grade = list(
            logs.values("grade").annotate(total_kg=Sum("quantity_kg")).order_by("grade")
        )

        return Response({
            "start": start, "end": end,
            "total_kg": total_kg,
            "grade_breakdown": by_grade,
            "entry_count": logs.count(),
        })


class CropsReportView(APIView):
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)
        reports = ProduceReport.objects.filter(report_date__range=(start, end))

        by_crop = list(
            reports.values("crop__name").annotate(total_kg=Sum("quantity_kg")).order_by("-total_kg")
        )
        by_bed = list(
            reports.values("plot_bed").annotate(total_kg=Sum("quantity_kg")).order_by("-total_kg")
        )

        return Response({
            "start": start, "end": end,
            "by_crop": by_crop,
            "by_plot_bed": by_bed,
            "entry_count": reports.count(),
        })


class PigsReportView(APIView):
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)

        total_pigs = Pig.objects.filter(status="active").count()
        births = PigActivityReport.objects.filter(
            activity_type="farrowing", report_date__range=(start, end)
        ).count()
        deaths = PigActivityReport.objects.filter(
            activity_type="death", report_date__range=(start, end)
        ).count()
        sales = PigSale.objects.filter(sale_date__range=(start, end))
        sales_total = sales.aggregate(total=Sum("total_amount"))["total"] or 0
        feed_pending = FeedRequest.objects.filter(status="pending").count()

        return Response({
            "start": start, "end": end,
            "total_active_pigs": total_pigs,
            "births": births,
            "deaths": deaths,
            "sales_count": sales.count(),
            "sales_total_amount": sales_total,
            "feed_requests_pending": feed_pending,
        })


class AquacultureReportView(APIView):
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)
        reports = PondReport.objects.filter(report_date__range=(start, end))

        harvests = reports.filter(activity_type="harvest").count()
        mortality_events = reports.filter(activity_type="mortality").count()
        active_ponds = Pond.objects.filter(status="active").count()

        return Response({
            "start": start, "end": end,
            "active_ponds": active_ponds,
            "harvest_events": harvests,
            "mortality_events": mortality_events,
            "total_report_entries": reports.count(),
        })


class FactoryReportView(APIView):
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)
        logs = ProductionLog.objects.filter(log_date__range=(start, end))

        by_line = list(
            logs.values("production_line")
            .annotate(
                total_input_kg=Sum("input_quantity_kg"),
                total_output=Sum("output_quantity"),
                batch_count=Count("id"),
            )
            .order_by("production_line")
        )

        return Response({
            "start": start, "end": end,
            "by_production_line": by_line,
        })


class ProductionSummaryView(APIView):
    """One combined endpoint pulling all departments together — for the main
    Production Reports page (§4.8)."""
    permission_classes = [CanViewReports]

    def get(self, request):
        start, end = _date_range(request)
        return Response({
            "start": start, "end": end,
            "tea": TeaReportView().get(request).data,
            "crops": CropsReportView().get(request).data,
            "pigs": PigsReportView().get(request).data,
            "aquaculture": AquacultureReportView().get(request).data,
            "factory": FactoryReportView().get(request).data,
        })