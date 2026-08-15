from django.db import models
from django.conf import settings


class Pond(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        FINGERLINGS = "fingerlings", "Fingerlings"
        HARVEST_READY = "harvest_ready", "Harvest Ready"
        HARVESTED = "harvested", "Harvested"
        EMPTY = "empty", "Empty"

    name = models.CharField(max_length=50)
    species = models.CharField(max_length=100, blank=True, null=True)
    stocking_date = models.DateField(blank=True, null=True)
    stocking_count = models.PositiveIntegerField(blank=True, null=True)
    feed_type = models.CharField(max_length=200, blank=True, null=True)
    target_harvest_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EMPTY)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class PondReport(models.Model):
    class ActivityType(models.TextChoices):
        FEED_LOG = "feed_log", "Feed Log"
        WATER_QUALITY = "water_quality", "Water Quality"
        WEIGHT_SAMPLE = "weight_sample", "Weight Sample"
        MORTALITY = "mortality", "Mortality"
        HARVEST = "harvest", "Harvest"

    pond = models.ForeignKey(Pond, on_delete=models.CASCADE, related_name="reports")
    report_date = models.DateField()
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    quantity_value = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="pond_reports"
    )

    class Meta:
        ordering = ["-report_date"]