from django.urls import path
from .views import (
    TeaReportView, CropsReportView, PigsReportView,
    AquacultureReportView, FactoryReportView, ProductionSummaryView,
)

urlpatterns = [
    path("reports/tea/", TeaReportView.as_view(), name="report-tea"),
    path("reports/crops/", CropsReportView.as_view(), name="report-crops"),
    path("reports/pigs/", PigsReportView.as_view(), name="report-pigs"),
    path("reports/aquaculture/", AquacultureReportView.as_view(), name="report-aquaculture"),
    path("reports/factory/", FactoryReportView.as_view(), name="report-factory"),
    path("reports/", ProductionSummaryView.as_view(), name="report-summary"),
]