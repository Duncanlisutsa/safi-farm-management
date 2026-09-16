from django.db import models
from django.conf import settings


class Herb(models.Model):
    class HerbType(models.TextChoices):
        HERB = "herb", "Herb"
        SPICE = "spice", "Spice"

    class PartUsed(models.TextChoices):
        LEAF = "leaf", "Leaf"
        ROOT = "root", "Root"
        STEM = "stem", "Stem"
        FLOWER = "flower", "Flower"
        SEED = "seed", "Seed"
        BARK = "bark", "Bark"
        WHOLE_PLANT = "whole_plant", "Whole Plant"

    class UseCategory(models.TextChoices):
        CULINARY = "culinary", "Culinary"
        MEDICINAL = "medicinal", "Medicinal"
        COMMERCIAL = "commercial", "Commercial"
        MULTIPLE = "multiple", "Multiple Uses"

    class DryingMethod(models.TextChoices):
        AIR_DRY = "air_dry", "Air Dried"
        SUN_DRY = "sun_dry", "Sun Dried"
        OVEN_DRY = "oven_dry", "Oven Dried"
        FRESH_ONLY = "fresh_only", "Used Fresh Only"
        NONE = "none", "Not Dried"

    class HarvestType(models.TextChoices):
        ONE_TIME = "one_time", "One-time Harvest"
        RECURRING = "recurring", "Recurring Harvest"

    class Status(models.TextChoices):
        PLANTED = "planted", "Planted"
        GROWING = "growing", "Growing"
        ACTIVE = "active", "Active (recurring harvest)"
        HARVESTED = "harvested", "Harvested"
        DORMANT = "dormant", "Dormant"
        RETIRED = "retired", "Retired"

    name = models.CharField(max_length=100)
    herb_type = models.CharField(max_length=20, choices=HerbType.choices)
    variety = models.CharField(max_length=100, blank=True, null=True)
    part_used = models.CharField(max_length=20, choices=PartUsed.choices)
    use_category = models.CharField(max_length=20, choices=UseCategory.choices)
    preparation_notes = models.TextField(blank=True, null=True)  # dosage, prep method, medicinal/culinary detail
    drying_method = models.CharField(max_length=20, choices=DryingMethod.choices, default=DryingMethod.NONE)
    harvest_type = models.CharField(max_length=20, choices=HarvestType.choices, default=HarvestType.RECURRING)
    plot_bed = models.CharField(max_length=100)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField(blank=True, null=True)
    actual_harvest_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANTED)
    photo = models.ImageField(upload_to="herb_photos/", blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="herbs_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-planting_date"]

    def __str__(self):
        return f"{self.name} ({self.plot_bed})"


class HerbHarvestLog(models.Model):
    class Unit(models.TextChoices):
        KG = "kg", "Kilograms"
        G = "g", "Grams"
        PIECES = "pieces", "Pieces (count)"
        BUNCHES = "bunches", "Bunches"

    herb = models.ForeignKey(Herb, on_delete=models.CASCADE, related_name="harvest_logs")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="herb_harvest_logs"
    )
    harvest_date = models.DateField()
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    part_harvested = models.CharField(max_length=20, choices=Herb.PartUsed.choices, blank=True, null=True)
    drying_method = models.CharField(max_length=20, choices=Herb.DryingMethod.choices, blank=True, null=True)
    plot_bed = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-harvest_date"]

    def __str__(self):
        return f"{self.herb.name} - {self.quantity} {self.unit} on {self.harvest_date}"