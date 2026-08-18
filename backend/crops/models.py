from django.db import models
from django.conf import settings


class Crop(models.Model):
    class CropType(models.TextChoices):
        VEGETABLE = "vegetable", "Vegetable"
        HERB = "herb", "Herb"
        SPICE = "spice", "Spice"
        ROOT = "root", "Root"
        FRUIT = "fruit", "Fruit"

    class Status(models.TextChoices):
        PLANTED = "planted", "Planted"
        GROWING = "growing", "Growing"
        READY = "ready", "Ready"
        HARVESTED = "harvested", "Harvested"

    name = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=20, choices=CropType.choices)
    variety = models.CharField(max_length=100, blank=True, null=True)
    uses = models.TextField(blank=True, null=True)  # herbs/spices: culinary, medicinal, commercial
    plot_bed = models.CharField(max_length=100)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField(blank=True, null=True)
    actual_harvest_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANTED)
    photo = models.ImageField(upload_to="crop_photos/", blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="crops_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-planting_date"]

    def __str__(self):
        return f"{self.name} ({self.plot_bed})"


class ProduceReport(models.Model):
    class Unit(models.TextChoices):
        KG = "kg", "Kilograms"
        PIECES = "pieces", "Pieces (count)"

    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name="produce_reports")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="produce_reports"
    )
    report_date = models.DateField()
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    plot_bed = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-report_date"]

    def __str__(self):
        return f"{self.crop.name} - {self.quantity} {self.unit} on {self.report_date}"